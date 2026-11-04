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
  const cancelled = new Set();
  for (const event of events) {
    if (!event.id) throw Error('Calendar event identity missing');
    const original = event.originalStartTime?.dateTime;
    const identity = [calendar, event.recurringEventId || event.id,
      original ? new Date(original).toISOString() : ''].join('\x1f');
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(identity)));
    const id = 'session-' + Array.from(digest.slice(0, 12), x => x.toString(16).padStart(2, '0')).join('');
    if (event.status === 'cancelled') {
      cancelled.add(id);
      continue;
    }
    if (event.visibility === 'private' || event.visibility === 'confidential' || !event.start?.dateTime) continue;
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
    const rawClass = valid ? parts[0] : 'レッスン';
    const teacher = valid ? parts.slice(1).find(x => !duration.test(x)) : '';
    const instructorName = teacher ? teacher.split(/[・/／]/).map(x => {
      const name = x.trim();
      return Object.hasOwn(aliases, name) ? aliases[name] : name;
    }).join('・') : 'スタジオに確認';
    const standard = rawClass.replace('🔰', '').trim().toUpperCase();
    const classType = ['STEP', 'TAP', 'STRETCH', 'ISOLATION', 'BAR METHOD', 'HIIT'].includes(standard)
      ? standard : rawClass;
    const className = rawClass.includes('🔰') && classType === 'STEP' ? 'STEP 超初級' : rawClass;
    const from = new Date(event.start.dateTime);
    const to = new Date(event.end?.dateTime);
    if (!(to > from)) throw Error('Invalid lesson times');
    const [date, start] = clock.format(from).split(' ');
    const [endDate, end] = clock.format(to).split(' ');
    if (endDate !== date || sessions.has(id)) throw Error('Conflicting lesson metadata');
    const publicStatus = ['CLOSE', 'CANCELLED'].includes(marker) ? marker :
      valid && teacher && event.status === 'confirmed' && marker !== 'INQUIRY_ONLY' ? 'OPEN' : 'INQUIRY_ONLY';
    sessions.set(id, { id, date, start, end, className, classType, instructorName, publicStatus });
  }
  for (const id of cancelled) sessions.delete(id);
  return [...sessions.values()];
}

export function reconcile(sessions, previous, now) {
  const ids = new Set(sessions.map(x => x.id));
  const active = [...sessions, ...previous.filter(x => !ids.has(x.id))
    .map(x => ({ ...x, publicStatus: 'CANCELLED' }))];
  return active.filter(x => Date.parse(x.date + 'T' + x.end + ':00+09:00') > now)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
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
    rows.push(...(payload.items ?? []));
    if (!payload.nextPageToken) return project(rows, calendar, env.RS_SESSION_ID_KEY);
    url.searchParams.set('pageToken', payload.nextPageToken);
  }
  throw Error('Calendar pagination limit exceeded');
}

export function createHandler({ read = readCalendar, now = Date.now } = {}) {
  let snapshot;
  let pending;
  return async function classes(request, env, cache) {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    const cacheKey = new Request(new URL('/.internal-schedule-cache-v1', request.url));
    if (!snapshot && cache) {
      try { snapshot = await (await cache.match(cacheKey))?.json(); } catch { /* Cache is optional. */ }
    }
    let ready = true;
    if (!snapshot || now() - Date.parse(snapshot.lastSuccessfulSyncAt) >= 60000) {
      pending ??= (async () => {
        const time = now();
        const rows = await read(env, time);
        snapshot = { lastSuccessfulSyncAt: new Date(time).toISOString(),
          sessions: reconcile(rows, snapshot?.sessions ?? [], time) };
        if (cache) {
          try { await cache.put(cacheKey, Response.json(snapshot, { headers: { 'Cache-Control': 'max-age=86400' } })); }
          catch { /* Keep the in-memory snapshot. */ }
        }
      })().finally(() => { pending = undefined; });
      try { await pending; } catch { ready = false; }
    }
    const usable = snapshot && now() - Date.parse(snapshot.lastSuccessfulSyncAt) < 86400000;
    return Response.json({
      source: 'google_calendar', dataState: ready ? 'ready' : usable ? 'stale' : 'unavailable',
      canRequest: ready, lastSuccessfulSyncAt: snapshot?.lastSuccessfulSyncAt ?? null,
      sessions: usable ? snapshot.sessions.filter(x => Date.parse(x.date + 'T' + x.end + ':00+09:00') > now()) : []
    }, { status: usable ? 200 : 503, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  };
}
