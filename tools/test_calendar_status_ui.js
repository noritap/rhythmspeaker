'use strict';
// Offline, dependency-free regression tests of real class-finder status helpers.
// Never fetch Calendar data or access GitHub secrets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/ux-lab/class-finder.js'), 'utf8');
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
assert.doesNotMatch(context.cfCard(closed), /このクラスに参加する/);
assert.doesNotMatch(context.cfCard(closed), /満席/);
assert.doesNotMatch(context.cfCard(closed), /開講中止/);
assert.equal(context.cfClosed(open), false);
assert.equal(context.cfStatusText(open), '相乗り受付中');
assert.match(context.cfCard(open), /このクラスに参加する/);
assert.equal(context.cfClosed(unknown), true);
assert.equal(context.cfClosed(cancelled), true);
assert.equal(context.cfStatusText(cancelled), '開講中止');
assert.match(source, /\['OPEN','CLOSE','INQUIRY_ONLY','CANCELLED'\]\.includes\(s\.publicStatus\)/);
assert.match(source, /const unavailable=cfClosed\(s\)/);
console.log('Calendar OPEN/CLOSE UI contract passed.');
