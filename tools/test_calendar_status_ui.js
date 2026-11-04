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
assert.doesNotMatch(context.cfCard(closed), /詳細・申し込み/);
assert.doesNotMatch(context.cfCard(closed), /満席/);
assert.doesNotMatch(context.cfCard(closed), /開講中止/);
assert.equal(context.cfClosed(open), false);
assert.match(context.cfCard(open), /詳細・申し込み/);
assert.doesNotMatch(context.cfCard(open), /参加申込受付中|定員10名|参加可否|予約人数|更新：/);
assert.match(context.cfCard(closed), /追加受付なし/);
assert.equal(context.cfStatusText(open), '参加申込受付中');
assert.match(context.cfCount(open), /定員10名｜参加可否はお申し込み後にご案内/);
assert.doesNotMatch(context.cfCard(open), /未連携|カレンダー掲載クラス|更新：/);
assert.match(source, /← レッスン日程に戻る/);
assert.match(source, /新しいクラスをリクエスト →/);
assert.doesNotMatch(source, /<div class="cf-sample" role="note">|01 \/ JOIN A CLASS|02 \/ REQUEST A LESSON|<div class="cf-policy">/);
assert.match(source, /スタジオから「予約確定」の返信/);
assert.match(source, /コピーしました。次は公式LINEに貼り付けて送信してください/);
assert.match(source, /cf-visually-hidden/);
assert.match(source, /<h2 id="cf-find-title" tabindex="-1">開催日を選ぶ<\/h2>/);
assert.match(staticPage, /初回体験 ¥1,000/);
assert.doesNotMatch(staticPage, /掲載中のクラスは開講が決定しています|予約の流れ|JOIN A CLASS|REQUEST A LESSON/);
assert.match(staticPage, /class-finder\.js\?v=20261104intuitive1/);
assert.match(source, /data-cf-mode="request"/);
assert.match(source, /view:'calendar',mode:'join'/);
assert.match(source, /date:cfToday\(\)/);
assert.match(source, /selected=match\.filter\(s=>s\.date===cfState\.date\)/);
assert.doesNotMatch(source, /id="cf-more"|data-cf-view="list"/);
assert.match(source, /selected\.map\(cfCard\)/);
assert.match(source, /https:\/\/lin\.ee\/zC5YLe7/);
assert.equal(context.cfClosed(unknown), true);
assert.equal(context.cfClosed(cancelled), true);
assert.equal(context.cfStatusText(cancelled), '開講中止');
assert.doesNotMatch(context.cfCard(open), /cf-label|サンプル/);
assert.ok(context.cfCard(closed).includes('詳細を見る'));
assert.match(source, /aria-describedby="cf-calendar-key-help"/);
assert.match(source, /日付の件数は開催クラス数です/);
assert.match(source, /\['OPEN','CLOSE','INQUIRY_ONLY','CANCELLED'\]\.includes\(s\.publicStatus\)/);
assert.match(source, /if\(cfClosed\(s\)\)return cfClosedReason\(s\)/);

// Refresh integration and safety behavior are exercised against real DOM/fetch
// in reservation_ux_browser_check.cjs, including a bounded request budget.
assert.match(source, /id="cf-refresh"[^>]*hidden/);
assert.match(source, /<details class="cf-advanced"><summary>講師・クラスで絞り込む<\/summary>/);
assert.match(source, /maxPerHour:20/);
assert.match(source, /cfReconcileSelection/);
assert.match(source, /cache:'no-store'/);
assert.match(source, /AbortSignal.timeout\(10_000\)/);
console.log('Calendar OPEN/CLOSE UI and bounded public-data refresh contract passed.');

const famLine = source.split('\n').find(x => x.startsWith('const cfClassFamily='));
const typesLine = source.split('\n').find(x => x.startsWith('const cfTypes='));
const choicesLine = source.split('\n').find(x => x.startsWith('const cfAvailableTypes='));
assert.ok(famLine && typesLine && choicesLine);
const familyScope = {};
vm.createContext(familyScope);
vm.runInContext([
  "let finderData={sessions:[{classType:'STEP & 振付'},{classType:'STEP🟡'},{classType:'TAP初級'},{classType:'TAP応用🔵'},{classType:'BAR メソッド'}]};",
  typesLine, famLine, choicesLine,
  "this.types=cfAvailableTypes();",
  "this.families=['STEP🔰','STEP🟡','STEP & 振付','TAP','Tap','TAP初級','TAP応用🔵','BAR METHOD','BAR メソッド','ISOLATION','STRETCH','HIIT'].map(cfClassFamily);",
  "this.unknown=cfClassFamily('新しい特別クラス');",
].join('\n'), familyScope);
assert.deepEqual(JSON.parse(JSON.stringify(familyScope.types)),
  ['STEP','TAP','STRETCH','ISOLATION','BAR METHOD','HIIT']);
assert.deepEqual(JSON.parse(JSON.stringify(familyScope.families)),
  ['STEP','STEP','STEP','TAP','TAP','TAP','TAP','BAR METHOD','BAR METHOD','ISOLATION','STRETCH','HIIT']);
assert.equal(familyScope.unknown, 'OTHER');
assert.match(source, /cfClassFamily\(s\.classType\)===cfState\.type/);
assert.doesNotMatch(source, /\.\.\.\(finderData\?\.sessions\|\|\[\]\)\.map\(s=>s\.classType\)/);

/* VC2 calendar bounds and conversion edge-case contracts. */
const calendarScope={cfToday:()=> '2026-11-04',Date};vm.createContext(calendarScope);
const helperLines=source.split('\n').filter(s=>s.startsWith('const cfCalendar'));
assert.equal(helperLines.length,3);
vm.runInContext(helperLines.join('\n')+"\nthis.end=cfCalendarEnd;this.day=cfCalendarDayAllowed;this.month=cfCalendarMonthAllowed;",calendarScope);
assert.equal(calendarScope.end('2026-11-04'),'2027-01-04');
assert.equal(calendarScope.end('2026-12-31'),'2027-02-28');
assert.equal(calendarScope.day('2027-01-05','2026-11-04'),false);
assert.equal(calendarScope.day('2026-11-03','2026-11-04'),false);
assert.equal(calendarScope.day('2027-01-04','2026-11-04'),true);
assert.equal(calendarScope.month('2027-02','2026-11-04'),false);
assert.equal(calendarScope.month('2026-11','2026-11-04'),true);
assert.match(source,/cfCalendarMonthAllowed\(month\)/);
assert.match(source,/data-cf-date]:not\(\[disabled\]\)/);
assert.match(source,/id="cf-results-jump"/);
assert.match(staticPage,/レッスン日程・参加申し込み/);
assert.doesNotMatch(staticPage,/<div class="cf-intro">/);
assert.doesNotMatch(staticPage,/<a class="crumb"/);
assert.doesNotMatch(staticPage,/TRY ANOTHER RHYTHM/);

/* New-class discovery does not imply an available or confirmed booking slot. */
assert.match(staticPage, /cf-offer-copy/);
assert.match(source, /function cfSwitchMode\(mode,fromSelectedDay=false\)/);
assert.match(source, /cfDraft.date=cfCalendarDayAllowed\(cfState.date\)\?cfState.date:cfToday\(\)/);
assert.match(source, /id="cf-day-invite" hidden/);
assert.match(source, /id="cf-request-day"/);
assert.match(source, /cfSwitchMode\('request',true\)/);
assert.match(source, /空き時間・講師の都合は確認後にご案内/);
assert.match(source, /この時点では予約は確定しません/);
assert.doesNotMatch(source, /id="cf-empty-request"/);
