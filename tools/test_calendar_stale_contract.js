'use strict';
// Regression test for the EXISTING, user-facing fallback; no changes to
// booking status, reservation flow, real calendar, or production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/ux-lab/class-finder.js','utf8');
// Read the complete production function even when its body spans several lines.
const functionSource = name => {
  const lines = source.split('\n');
  const start = lines.findIndex(x=>x.startsWith('function '+name+'('));
  assert.ok(start>=0, 'missing production function: '+name);
  let end=start;
  // Current functions use a closing brace at the end of their final line.
  while (end<lines.length-1 && !lines[end].trim().endsWith('}')) end++;
  assert.ok(lines[end].trim().endsWith('}'), 'incomplete function: '+name);
  return lines.slice(start,end+1).join('\n');
};
const stale = source.split('\n').find(x=>x.startsWith('const cfStale='));
assert.ok(stale);
const script = [
  "let finderData={sourceMode:'live',dataState:'ready',lastSuccessfulSyncAt:new Date(Date.now()-31*3600000).toISOString(),sessions:[{publicStatus:'OPEN'}]};",
  "let cfScenario='normal',cfDataError=false;",
  "const cfUpdated = () => '31 hours ago';",
  stale,
  functionSource('cfSessions'),
  functionSource('cfDataStatus'),
  functionSource('cfUnavailable')
].join('\n');
const context = {Date,structuredClone};
vm.createContext(context);
vm.runInContext(script,context);
assert.equal(vm.runInContext('cfStale()',context),true);
// Four-hour-old daily publications are expected, not an outage.
assert.equal(vm.runInContext("finderData.lastSuccessfulSyncAt=new Date(Date.now()-4*3600000).toISOString();cfStale()",context),false);
vm.runInContext("finderData.lastSuccessfulSyncAt=new Date(Date.now()-31*3600000).toISOString()",context);
assert.equal(vm.runInContext('cfSessions().length',context),0,
  'never expose stale OPEN as current available to book');
const html=vm.runInContext('cfUnavailable()',context);
assert.match(html,/開催情報の同期が遅れています/);
assert.match(html,/空き状況は判断できません/);
assert.match(html,/スタジオ公式LINE/);
assert.match(html,/https:\/\/lin\.ee\/zC5YLe7/);
assert.match(html,/メールで問い合わせる/);
assert.doesNotMatch(html,/参加申込受付中|今すぐ予約確定/);
const banner=vm.runInContext('cfDataStatus()',context);
assert.match(banner,/開催情報の同期が遅れています/);
assert.match(banner,/最新の状態はスタジオへご確認ください/);
console.log('A missed daily sync (>30h) uses a safe LINE/email fallback, not stale OPEN bookings.');
