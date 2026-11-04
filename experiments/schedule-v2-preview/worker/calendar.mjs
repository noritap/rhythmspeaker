const scope = 'https://www.googleapis.com/auth/calendar.events.readonly';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const encoder = new TextEncoder();
const day = 86400000;
const clock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short'
});
const aliases = {
  古庄: '古庄里好', 本間: '本間茂樹', 丹生: '丹生良彬', 奥平: '奥平崇史',
  MiFa: 'MiFa-san', 'Mi Fa-san': 'MiFa-san'
};
const base64url = bytes => btoa(String.fromCharCode(...bytes))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const encode = value => base64url(encoder.encode(JSON.stringify(value)));

async function authenticate(env) {
  const account = JSON.parse(env.RS_GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const claim = encode({ alg: 'RS256', typ: 'JWT' }) + '.' +
    encode({ iss: account.client_email, scope, aud: tokenUrl, iat: now, exp: now + 600 });
  const pem = account.private_key.replace(/-----[^-]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(claim));
  const result = await fetch(tokenUrl, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: claim + '.' + base64url(new Uint8Array(signature)) }) });
  if (!result.ok) throw Error('Calendar authorization failed');
  const { access_token: token } = await result.json();
  if (!token) throw Error('Calendar token missing');
  return token;
}

export async function project(events, calendar, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sessions = new Map();
  const suppressed = new Set();
  for (const event of events) {
    if (!event.id) throw Error('Calendar event identity missing');
    const original = event.originalStartTime?.dateTime;
    const identity = [calendar, event.recurringEventId || event.id,
      original ? new Date(original).toISOString() : ''].join('\x1f');
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(identity)));
    const id = 'session-' + Array.from(digest.slice(0, 12), x => x.toString(16).padStart(2, '0')).join('');
    if (event.status === 'cancelled' || ['private', 'confidential'].includes(event.visibility)) {
      suppressed.add(id);
      continue;
    }
    if (!event.start?.dateTime || typeof event.summary !== 'string') continue;
    const summary = event.summary?.trim();
    if (!summary || summary.length > 180 || /[@＠]|https?:|www\.|(?:\d[\s()+-]*){9,}/i.test(summary)) {
      throw Error('Calendar title failed publication check');
    }
    const parts = summary.split(/[|｜]/).map(x => x.trim());
    const marker = /(?:^|[|｜\s])(OPEN|CLOSE|CANCELLED|INQUIRY_ONLY)\s*$/i.exec(summary)?.[1]?.toUpperCase();
    if (/^(OPEN|CLOSE|CANCELLED|INQUIRY_ONLY)$/i.test(parts.at(-1))) parts.pop();
    const duration = /^\d{2,3}\s*m$/i;
    const valid = [2, 3].includes(parts.length) && parts.every(Boolean) &&
      parts.slice(1).filter(x => duration.test(x)).length === 1;
    if (!valid || !/^(?:STEP|TAP|STRETCH|ISOLATION|BAR|HIIT)(?![A-Z])/i.test(parts[0])) continue;
    const rawClass = parts[0];
    const teacher = parts.slice(1).find(x => !duration.test(x));
    const instructorName = teacher ? teacher.split(/[・/／]/).map(x => {
      const name = x.trim();
      return Object.hasOwn(aliases, name) ? aliases[name] : name;
    }).join('・') : 'スタジオに確認';
    const standard = rawClass.replace('🔰', '').trim().toUpperCase();
    const classType = ['STEP', 'TAP', 'STRETCH', 'ISOLATION', 'BAR METHOD', 'HIIT'].includes(standard)
      ? standard : rawClass;
    const className = rawClass.includes('🔰') && classType === 'STEP' ? 'STEP 超初級' : classType===standard ? standard : rawClass;
    const from = new Date(event.start.dateTime);
    const to = new Date(event.end?.dateTime);
    if (!(to > from)) throw Error('Invalid lesson times');
    const [date, start] = clock.format(from).split(' ');
    const [endDate, end] = clock.format(to).split(' ');
    if (endDate !== date || sessions.has(id)) throw Error('Conflicting lesson metadata');
    const publicStatus = ['CLOSE', 'CANCELLED'].includes(marker) ? marker :
      teacher && event.status === 'confirmed' && marker !== 'INQUIRY_ONLY' ? 'OPEN' : 'INQUIRY_ONLY';
    sessions.set(id, { id, date, start, end, className, classType, instructorName, publicStatus });
  }
  for (const id of suppressed) sessions.delete(id);
  return [...sessions.values()];
}

async function readCalendar(env, now) {
  if (!env.RS_LESSON_CALENDAR_ID || !env.RS_SESSION_ID_KEY || env.RS_PUBLICATION_APPROVED !== 'true') {
    throw Error('Lab calendar configuration incomplete');
  }
  const token = await authenticate(env);
  const calendar = env.RS_LESSON_CALENDAR_ID;
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendar) + '/events');
  url.search = new URLSearchParams({ singleEvents: 'true', showDeleted: 'true', maxResults: '2500',
    timeMin: clock.format(now).slice(0, 10) + 'T00:00:00+09:00',
    timeMax: clock.format(now + 90 * day).slice(0, 10) + 'T00:00:00+09:00',
    timeZone: 'Asia/Tokyo',
    fields: 'accessRole,nextPageToken,items(id,recurringEventId,originalStartTime,status,visibility,summary,start,end)' });
  const rows = [];
  for (let page = 0; page < 10; page++) {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token },
      redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw Error('Calendar request failed');
    const payload = await res.json();
    if (!['reader', 'writer', 'owner'].includes(payload.accessRole)) throw Error('Calendar read access missing');
    if (!Array.isArray(payload.items)) throw Error('Invalid Calendar items');
    rows.push(...payload.items);
    if (!payload.nextPageToken) return project(rows, calendar, env.RS_SESSION_ID_KEY);
    url.searchParams.set('pageToken', payload.nextPageToken);
  }
  throw Error('Calendar pagination limit exceeded');
}

export function createHandler({ read = readCalendar, now = Date.now } = {}) {
  return async function classes(request, env) {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } });
    const unavailable = () => Response.json({
      source: 'google_calendar', dataState: 'unavailable', canRequest: false,
      lastSuccessfulSyncAt: null, sessions: []
    }, { status: 503, headers });
    if (env.RS_PUBLICATION_APPROVED !== 'true') return unavailable();
    try {
      // Never serve an older projection, even on upstream failure or a cold start.
      const rows = await read(env, now());
      if (env.RS_PUBLICATION_APPROVED !== 'true') return unavailable();
      const time = now();
      const sessions = rows.filter(x => Date.parse(x.date + 'T' + x.end + ':00+09:00') > time)
        .map(x => x.publicStatus==='OPEN' && Date.parse(x.date+'T'+x.start+':00+09:00')<=time
          ? { ...x, publicStatus: 'CLOSE' } : x)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
      return Response.json({ source: 'google_calendar', dataState: 'ready', canRequest: true,
        lastSuccessfulSyncAt: new Date(time).toISOString(), sessions }, { headers });
    } catch {
      return unavailable();
    }
  };
}
