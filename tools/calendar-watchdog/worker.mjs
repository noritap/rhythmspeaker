// Rhythm Speaker independent class-calendar watchdog (Cloudflare Worker).
// Read only public data, except a narrowly scoped GitHub workflow_dispatch.
// No Google Calendar/booking/visitor/student data is accessed or stored.
export const CONFIG = Object.freeze({
  repo: 'noritap/rhythmspeaker',
  workflow: 'class-calendar-sync.yml',
  githubApi: 'https://api.github.com',
  sourceUrl: 'https://raw.githubusercontent.com/noritap/rhythmspeaker/main/data/class-sessions.public.json',
  pagesUrl: 'https://noritap.github.io/rhythmspeaker/data/class-sessions.public.json',
  staleMs: 90 * 60_000,
  recentRunMs: 60 * 60_000,
  maxFutureMs: 5 * 60_000
});

function checkedTime(envelope, now) {
  if (!envelope || envelope.sourceMode !== 'live' || envelope.dataState !== 'ready') return null;
  const value = Date.parse(envelope.lastSuccessfulSyncAt || '');
  if (!Number.isFinite(value) || value > now + CONFIG.maxFutureMs) return null;
  return value;
}

// Pure decision function; use for deterministic offline regression tests.
export function decide({source, pages, runs, now}) {
  const sourceAt = checkedTime(source, now);
  const pagesAt = checkedTime(pages, now);
  if (sourceAt === null) return {kind:'source_invalid', dispatch:false, alert:true};
  if (pagesAt === null) return {kind:'pages_invalid', dispatch:false, alert:true};

  const sourceAge = now - sourceAt;
  const pagesAge = now - pagesAt;
  if (sourceAge < CONFIG.staleMs && pagesAge < CONFIG.staleMs) {
    return {kind:'healthy', dispatch:false, alert:false};
  }
  if (sourceAge < CONFIG.staleMs) {
    // GitHub source is up to date. Another dispatch won't repair Pages/CDN lag.
    return {kind:'pages_lagging', dispatch:false, alert:true};
  }

  // Never create unbounded queued jobs. The scheduler can arrive late.
  // PR validation jobs are not production sync attempts and must not suppress
  // recovery merely because a developer updated the workflow.
  const productionRuns = (runs || []).filter(r =>
    (r.event === 'schedule' || r.event === 'workflow_dispatch') && r.head_branch === 'main');
  const active = productionRuns.some(r => r.status === 'queued' || r.status === 'in_progress' || r.status === 'waiting');
  if (active) return {kind:'existing_job_active', dispatch:false, alert:true};
  const recent = productionRuns.some(r => {
    const started = Date.parse(r.created_at || '');
    return Number.isFinite(started) && started <= now + CONFIG.maxFutureMs
      && started >= now - CONFIG.recentRunMs;
  });
  if (recent) return {kind:'recent_job_cooldown', dispatch:false, alert:true};
  return {kind:'dispatch_needed', dispatch:true, alert:true};
}

function b64url(input) {
  const binary = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let s = '';
  for (let i=0; i<binary.length; i++) s += String.fromCharCode(binary[i]);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function installationToken(env, f, now) {
  if (!env.GH_APP_ID || !env.GH_APP_INSTALLATION_ID || !env.GH_APP_PKCS8_PRIVATE_KEY) {
    throw new Error('GitHub App is not configured');
  }
  // GitHub's downloaded RSA PKCS#1 key must first be converted to unencrypted
  // PKCS#8 PEM for WebCrypto import. Never commit or log the original key.
  const pem = env.GH_APP_PKCS8_PRIVATE_KEY;
  if (!/-----BEGIN PRIVATE KEY-----/.test(pem)) throw new Error('Expected PKCS#8 private key secret');
  const bytes = Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g,'')), c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', bytes, {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const issued = Math.floor(now / 1000);
  const header = b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const payload = b64url(JSON.stringify({iat:issued - 60,exp:issued + 8*60,iss:String(env.GH_APP_ID)}));
  const signingInput = header + '.' + payload;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = signingInput + '.' + b64url(new Uint8Array(signature));
  const resp = await f(`${CONFIG.githubApi}/app/installations/${encodeURIComponent(env.GH_APP_INSTALLATION_ID)}/access_tokens`,{
    method:'POST',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+jwt,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'rs-calendar-watchdog'},
    body:JSON.stringify({repositories:['rhythmspeaker'],permissions:{actions:'write'}})
  });
  if(!resp.ok) throw new Error('GitHub installation token request failed: HTTP '+resp.status);
  const obj = await resp.json();
  if (!obj.token) throw new Error('GitHub App installation token response missing token');
  return obj.token;
}

async function readJson(f, url, now, headers={}) {
  const u = new URL(url);
  u.searchParams.set('watchdog', String(now)); // avoid stale edge copies
  const response = await f(u.toString(),{headers,cache:'no-store'});
  if (!response.ok) throw new Error('Read failed for ' + u.hostname + ': HTTP ' + response.status);
  return response.json();
}

async function alert(env, f, kind) {
  if (!env.ALERT_WEBHOOK_URL) return;
  // Only a non-sensitive status code and public dashboard URL leave the Worker.
  const response = await f(env.ALERT_WEBHOOK_URL,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({text:'Rhythm Speaker calendar watchdog: '+kind,
       dashboard:'https://github.com/noritap/rhythmspeaker/actions/workflows/class-calendar-sync.yml'})
  });
  if (!response.ok) throw new Error('Alert webhook returned HTTP '+response.status);
}

export async function monitor(env, f=fetch, now=Date.now()) {
  try {
    // Authenticate workflow reads as well as recovery dispatches. Anonymous
    // requests from shared egress can exhaust GitHub's API rate limit.
    const token = await installationToken(env,f,now);
    const [source,pages,workflow] = await Promise.all([
      readJson(f, CONFIG.sourceUrl, now),
      readJson(f, CONFIG.pagesUrl, now),
      readJson(f, `${CONFIG.githubApi}/repos/${CONFIG.repo}/actions/workflows/${CONFIG.workflow}/runs?branch=main&per_page=20`, now,
        {'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'rs-calendar-watchdog'})
    ]);
    if (!Array.isArray(workflow.workflow_runs)) throw new Error('GitHub workflow runs malformed');
    const result = decide({source,pages,runs:workflow.workflow_runs,now});
    if (result.dispatch) {
      const response = await f(`${CONFIG.githubApi}/repos/${CONFIG.repo}/actions/workflows/${CONFIG.workflow}/dispatches`,{
        method:'POST',headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
          'X-GitHub-Api-Version':'2022-11-28','User-Agent':'rs-calendar-watchdog'},
        body:JSON.stringify({ref:'main'})
      });
      if (!response.ok) throw new Error('workflow_dispatch rejected: HTTP '+response.status);
      await alert(env,f,'recovery_dispatched');
      console.log('calendar watchdog recovery dispatched');
      return 'recovery_dispatched';
    }
    if (result.alert) await alert(env,f,result.kind);
    console.log('calendar watchdog status:',result.kind);
    return result.kind;
  } catch (error) {
    console.error('calendar watchdog failed:', String(error.message || error).slice(0,180));
    try { await alert(env,f,'monitor_failed'); } catch { console.error('calendar watchdog alert delivery failed'); }
    throw new Error('calendar watchdog monitoring failed');
  }
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(monitor(env));
  },
  async fetch() {
    // No public endpoint capable of triggering a privileged operation.
    return new Response('Not Found', {status:404});
  }
};
