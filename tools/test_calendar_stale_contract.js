'use strict';
// Regression test for the EXISTING, user-facing fallback; no changes to
// booking status, reservation flow, real calendar, or production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/ux-lab/class-finder.js','utf8');
const oneLine = name => {
  const line = source.split('\n').find(x=>x.startsWith('function '+name+'('));
  assert.ok(line, 'missing production function: '+name);
  return line;
};
const stale = source.split('\n').find(x=>x.startsWith('const cfStale='));
assert.ok(stale);
const script = [
  "let finderData={sourceMode:'live',dataState:'ready',lastSuccessfulSyncAt:new Date(Date.now()-4*3600000).toISOString(),sessions:[{publicStatus:'OPEN'}]};",
  "let cfScenario='normal';",
  "const cfUpdated = () => 'four hours ago';",
  stale,
  oneLine('cfSessions'),
  oneLine('cfDataStatus'),
  oneLine('cfUnavailable')
].join('\n');
const context = {Date,structuredClone};
vm.createContext(context);
vm.runInContext(script,context);
assert.equal(vm.runInContext('cfStale()',context),true);
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
console.log('Stale class schedule uses a safe LINE/email fallback, not stale OPEN bookings.');
