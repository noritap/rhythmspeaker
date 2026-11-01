import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateKeyPairSync} from 'node:crypto';
import watchdog, {CONFIG,decide,monitor} from './worker.mjs';

const NOW = Date.parse('2026-11-02T07:00:00+09:00');
const envelope = minutes => ({
  sourceMode:'live',dataState:'ready',
  lastSuccessfulSyncAt:new Date(NOW-minutes*60_000).toISOString()
});
const run = (minutes, status='completed', event='schedule', head_branch='main')=>({created_at:new Date(NOW-minutes*60_000).toISOString(),status,event,head_branch});

test('fresh repo and Pages: healthy', ()=>{
  assert.deepEqual(decide({source:envelope(18),pages:envelope(18),runs:[],now:NOW}),
    {kind:'healthy',dispatch:false,alert:false});
});
test('GitHub is current but published Pages stale: alert, do not dispatch', ()=>{
  assert.equal(decide({source:envelope(10),pages:envelope(150),runs:[],now:NOW}).kind,'pages_lagging');
});
test('PR and non-main executions cannot suppress production recovery', ()=>{
  const recentPR = run(5,'in_progress','pull_request','test-branch');
  const differentBranch = run(5,'completed','workflow_dispatch','test-branch');
  const result = decide({source:envelope(120),pages:envelope(120),runs:[recentPR,differentBranch],now:NOW});
  assert.equal(result.kind,'dispatch_needed');
  assert.equal(result.dispatch,true);
});
test('stale repository and no recent runs: request bounded recovery', ()=>{
  assert.deepEqual(decide({source:envelope(120),pages:envelope(120),runs:[],now:NOW}),
    {kind:'dispatch_needed',dispatch:true,alert:true});
});
test('never dispatch while scheduled job is running or queued', ()=>{
  for(const status of ['queued','in_progress','waiting']){
    assert.equal(decide({source:envelope(120),pages:envelope(120),runs:[run(5,status)],now:NOW}).dispatch,false);
  }
});
test('recent completed job imposes cooldown and no redispatch loop', ()=>{
  assert.equal(decide({source:envelope(120),pages:envelope(120),runs:[run(20)],now:NOW}).kind,'recent_job_cooldown');
});
test('malformed or future timestamps never trigger privileged action', ()=>{
  const invalid=[{}, {...envelope(120),dataState:'sync_failed'},
    {...envelope(120),lastSuccessfulSyncAt:'2040-01-01T00:00:00Z'}];
  for(const source of invalid)
    assert.equal(decide({source,pages:envelope(120),runs:[],now:NOW}).dispatch,false);
});
test('malformed Pages data never triggers extra Google/GitHub calls', ()=>{
  assert.equal(decide({source:envelope(120),pages:{dataState:'unavailable'},runs:[],now:NOW}).kind,'pages_invalid');
});
test('public HTTP endpoint is inert',async()=>{
  const resp=await watchdog.fetch();
  assert.equal(resp.status,404);
});

function scenario({source=envelope(120),pages=envelope(120),runs=[],app=true,alert=true}={}) {
  const calls=[];
  const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const env=app?{
    GH_APP_ID:'1234',GH_APP_INSTALLATION_ID:'5678',
    GH_APP_PKCS8_PRIVATE_KEY:privateKey.export({type:'pkcs8',format:'pem'}),
    ...(alert?{ALERT_WEBHOOK_URL:'https://example.net/alert'}:{})
  }:{};
  async function fakeFetch(url,opts={}){
    calls.push({url,method:opts.method||'GET',body:opts.body,authorization:opts.headers?.Authorization});
    const pathname=new URL(url).pathname;
    const json = object=>({ok:true,status:200,json:async()=>object});
    if(pathname.endsWith('/data/class-sessions.public.json')){
      return json(new URL(url).hostname==='raw.githubusercontent.com'?source:pages);
    }
    if(pathname.endsWith('/runs'))return json({workflow_runs:runs});
    if(pathname.endsWith('/access_tokens'))return json({token:'unit-test-installation-token'});
    if(pathname.endsWith('/dispatches'))return {ok:true,status:204};
    if(pathname==='/alert')return {ok:true,status:200};
    throw Error('unexpected fetch '+url);
  }
  return {calls,env,fakeFetch};
}
test('end-to-end mock dispatch signs JWT and posts only target workflow to main',async()=>{
  const s=scenario();
  assert.equal(await monitor(s.env,s.fakeFetch,NOW),'recovery_dispatched');
  const dispatch=s.calls.filter(c=>c.url.endsWith('/dispatches'));
  assert.equal(dispatch.length,1);
  assert.equal(dispatch[0].authorization,'Bearer unit-test-installation-token');
  assert.deepEqual(JSON.parse(dispatch[0].body),{ref:'main'});
  const token=s.calls.find(c=>c.url.endsWith('/access_tokens'));
  assert.match(token.authorization,/^Bearer eyJ/);
  const payload=JSON.parse(Buffer.from(token.authorization.split('.')[1],'base64url').toString());
  assert.equal(payload.iss,'1234');
  assert.ok(payload.exp-payload.iat<=10*60);
  assert.equal(s.calls.filter(c=>c.url.endsWith('/alert')).length,1);
});
test('no secrets prevents dispatch and reports monitor_failed',async()=>{
  const s=scenario({app:false});
  await assert.rejects(()=>monitor(s.env,s.fakeFetch,NOW),/monitoring failed/);
  assert.equal(s.calls.filter(c=>c.url.endsWith('/dispatches')).length,0);
});
test('recent workflow run permits authenticated read but blocks dispatch',async()=>{
  const s=scenario({runs:[run(10)]});
  assert.equal(await monitor(s.env,s.fakeFetch,NOW),'recent_job_cooldown');
  assert.equal(s.calls.filter(c=>c.url.endsWith('/access_tokens')).length,1);
  assert.equal(s.calls.some(c=>c.url.endsWith('/dispatches')),false);
});
test('source is current but Pages stale: authenticated read without dispatch',async()=>{
  const s=scenario({source:envelope(10),pages:envelope(150)});
  assert.equal(await monitor(s.env,s.fakeFetch,NOW),'pages_lagging');
  assert.equal(s.calls.some(c=>c.url.endsWith('/dispatches')),false);
});
test('fresh run: authenticated workflow read, no webhook or dispatch',async()=>{
  const s=scenario({source:envelope(10),pages:envelope(12)});
  assert.equal(await monitor(s.env,s.fakeFetch,NOW),'healthy');
  assert.equal(s.calls.some(c=>c.url.endsWith('/alert')),false);
});

test('workflow reads authenticate and never leak installation token to public JSON or alerts', async()=>{
  const s=scenario({source:envelope(10),pages:envelope(12)});
  await monitor(s.env,s.fakeFetch,NOW);
  const runs=s.calls.find(c=>new URL(c.url).pathname.endsWith('/runs'));
  assert.equal(runs.authorization,'Bearer unit-test-installation-token');
  assert.equal(s.calls.filter(c=>c.url.endsWith('/access_tokens')).length,1);
  for(const c of s.calls.filter(c=>c.url.includes('class-sessions.public.json')||c.url.endsWith('/alert')))
    assert.equal(c.authorization,undefined);
});
