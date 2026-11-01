'use strict';
// Offline, dependency-free regression tests of real class-finder status helpers.
// Never fetch Calendar data or access GitHub secrets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/ux-lab/class-finder.js'), 'utf8');
const staticPage = fs.readFileSync(path.join(__dirname, '../schedule/index.html'), 'utf8');
vm.createContext({});
new vm.Script(source, {filename: 'class-finder.js'}); // Check complete production script syntax.
const names = ['cfClosed', 'cfStatusText', 'cfClosedReason', 'cfCount', 'cfCard'];
const snippets = names.map(name => {
  const line = source.split('\n').find(x => x.startsWith('function ' + name + '('));
  assert.ok(line, 'Missing production UI function ' + name);
  return line;
}).join('\n');
const context = {
  cfPerson: () => ({name: '講師'}),
  cfDate: d => d,
  cfUpdated: () => 'update',
  esc: s => String(s),
};
vm.createContext(context);
vm.runInContext(snippets, context, {filename: 'production-class-finder.js'});
const lesson = {
  id: 'session-valid', source: 'live', className: 'STEP🔰',
  classType: 'STEP', level: '', date: '2026-11-05', start: '10:00',
  end: '11:00', capacity: 10, instructorId: 'teacher',
  bookingCountStatus: 'unknown', confirmedBookingCount: null,
  bookingCountSource: null, updatedAt: null
};
const closed = {...lesson, publicStatus: 'CLOSE'};
const open = {...lesson, publicStatus: 'OPEN'};
const unknown = {...lesson, publicStatus: 'INQUIRY_ONLY'};
const cancelled = {...lesson, publicStatus: 'CANCELLED'};
assert.equal(context.cfClosed(closed), true);
assert.equal(context.cfStatusText(closed), '追加受付なし');
assert.match(context.cfClosedReason(closed), /相乗り受講の追加申し込みは受け付けていません/);
assert.match(context.cfCard(closed), /追加受付なし/);
assert.match(context.cfCard(closed), /詳細を見る/);
assert.doesNotMatch(context.cfCard(closed), /詳細・参加申込へ/);
assert.doesNotMatch(context.cfCard(closed), /満席/);
assert.doesNotMatch(context.cfCard(closed), /開講中止/);
assert.equal(context.cfClosed(open), false);
assert.match(context.cfCard(open), /詳細・参加申込へ/);
assert.equal(context.cfStatusText(open), '参加申込受付中');
assert.match(context.cfCount(open), /定員10名｜参加可否はお申し込み後にご案内/);
assert.doesNotMatch(context.cfCard(open), /未連携|カレンダー掲載クラス|更新：/);
assert.match(source, /<strong>開催予定から選ぶ<\/strong>/);
assert.match(source, /<strong>希望日時で相談する<\/strong>/);
assert.match(source, /掲載中のクラスは開講が決定しています/);
assert.match(source, /スタジオから「予約確定」の返信/);
assert.match(source, /申込内容をコピーしてLINEへ送る/);
assert.match(source, /LINEで申し込む場合は、①文章をコピー/);
assert.match(source, /<h2 id="cf-find-title">開催予定から探す<\/h2>/);
assert.match(staticPage, /初回体験 ¥1,000を見る/);
assert.match(staticPage, /掲載中のクラスは開講が決定しています/);
assert.match(staticPage, /スタジオから「予約確定」の返信/);
assert.match(staticPage, /class-finder\.js\?v=20261101refresh1/);
assert.match(source, /data-cf-mode="request"/);
assert.match(source, /https:\/\/lin\.ee\/zC5YLe7/);
assert.equal(context.cfClosed(unknown), true);
assert.equal(context.cfClosed(cancelled), true);
assert.equal(context.cfStatusText(cancelled), '開講中止');
assert.match(source, /\['OPEN','CLOSE','INQUIRY_ONLY','CANCELLED'\]\.includes\(s\.publicStatus\)/);
assert.match(source, /const unavailable=cfClosed\(s\)/);

assert.match(source, /id="cf-refresh"/);
assert.match(source, /開催情報を再読み込み/);
assert.match(source, /Googleカレンダーの変更は原則毎時の自動同期後に反映されます/);
assert.match(source, /\.onclick=cfRefreshPublished/);
const refreshBlock = source.match(/async function cfRefreshPublished\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(refreshBlock, 'Refresh function must exist in the published JS');
assert.match(refreshBlock, /url\.searchParams\.set\('refresh',String\(Date\.now\(\)\)\)/);
assert.match(refreshBlock, /fetch\(url,\{cache:'no-store'\}\)/);
assert.doesNotMatch(refreshBlock, /secrets|GoogleAuth|calendar\.googleapis|workflow_dispatch/);

(async () => {
  let fail = false, fetched = 0, publishedAt = '2026-11-01T09:30:00+09:00';
  let refreshButton = {disabled:false}, refreshStatus = {textContent:''};
  const env = {
    URL, Date, Promise, Set, Error,
    uxRoot: 'https://noritap.github.io/rhythmspeaker/',
    uxContactsPromise: Promise.resolve([{id:'teacher',name:'講師',classes:['STEP'],line:'https://lin.ee/zC5YLe7'}]),
    fetch: async (url,opts) => {
      fetched++;
      assert.equal(opts.cache, 'no-store');
      assert.ok(url.pathname.endsWith('/data/class-sessions.public.json'));
      assert.ok(url.searchParams.get('refresh'));
      if(fail)throw Error('Network failure');
      return {ok:true,json:async()=>({
        sourceMode:'live',dataState:'ready',lastSuccessfulSyncAt:publishedAt,
        instructors:[],sessions:[{id:'session-123',publicStatus:'CLOSE'}]
      })};
    },
    cfValidateEnvelope: v => v,
    cfStale: ()=>false,
    cfRenderMode: ()=>{refreshButton={disabled:false};refreshStatus={textContent:''};},
    document: {querySelector: selector => ({
      '#cf-refresh': refreshButton,
      '#cf-refresh-status': refreshStatus,
      '#cf-content': {}
    })[selector]||null}
  };
  vm.createContext(env);
  vm.runInContext(
    `let finderData={lastSuccessfulSyncAt:'2026-11-01T08:48:00+09:00',sessions:[]};
     let finderLoad=null,cfRefreshing=false;const cfState={mode:'join'};`+refreshBlock,env
  );
  await vm.runInContext('cfRefreshPublished()',env);
  assert.equal(fetched,1);
  assert.match(refreshStatus.textContent,/新しい開催情報を反映しました/);
  assert.equal(vm.runInContext('finderData.sessions[0].publicStatus',env),'CLOSE');
  await vm.runInContext('cfRefreshPublished()',env);
  assert.match(refreshStatus.textContent,/前回から変更はありません/);
  fail=true;
  await vm.runInContext('cfRefreshPublished()',env);
  assert.match(refreshStatus.textContent,/確認できませんでした/);
  assert.equal(vm.runInContext('finderData.sessions[0].publicStatus',env),'CLOSE');
  assert.equal(refreshButton.disabled,false);
  assert.equal(fetched,3);
  console.log('Calendar OPEN/CLOSE and public-data refresh UI contract passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

