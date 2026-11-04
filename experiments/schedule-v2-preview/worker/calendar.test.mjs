import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, project, reconcile } from './calendar.mjs';

const time = Date.parse('2026-11-04T16:00:00+09:00');
const event = {
  id: 'raw-id', recurringEventId: 'series', originalStartTime: { dateTime: '2026-11-04T22:00:00Z' },
  start: { dateTime: '2026-11-04T22:00:00Z' }, end: { dateTime: '2026-11-04T23:00:00Z' },
  status: 'confirmed', summary: 'STEP🔰｜60m｜古庄｜OPEN',
  description: 'private note', attendees: [{ email: 'person@example.com' }]
};
const publish = rows => project(rows, 'calendar', 'fixture-key');
test('JST, recurrence, change, deletion, privacy and duplicate handling', async () => {
  const [first] = await publish([event]);
  assert.equal(first.date, '2026-11-05');
  assert.equal(first.start, '07:00');
  assert.equal(first.instructorName, '古庄里好');
  assert.equal(first.className, 'STEP 超初級');
  assert.doesNotMatch(JSON.stringify(first), /raw-id|series|private note|example.com/);
  const moved = { ...event, start: { dateTime: '2026-11-05T10:00:00+09:00' },
    end: { dateTime: '2026-11-05T11:00:00+09:00' } };
  const [changed] = await publish([moved]);
  assert.equal(changed.id, first.id);
  assert.equal(changed.start, '10:00');
  for (const rows of [[], [{ ...event, status: 'cancelled' }], [{ ...event, visibility: 'private' }]]) {
    assert.equal(reconcile(await publish(rows), [first], time)[0].publicStatus, 'CANCELLED');
  }
  await assert.rejects(publish([event, event]), /Conflicting/);
  await assert.rejects(publish([{ ...event, summary: 'person@example.com' }]), /publication/);
  const [closed, inquiry] = await publish([
    { ...event, summary: 'TAP｜古庄｜60m｜CLOSE' },
    { ...event, recurringEventId: null, summary: 'Isolation｜60m｜OPEN' }
  ]);
  assert.equal(closed.publicStatus, 'CLOSE');
  assert.equal(inquiry.publicStatus, 'INQUIRY_ONLY');
});
test('cache, refresh failure, expiry and genuinely empty schedules', async () => {
  let now = time, calls = 0;
  const row = (await publish([event]))[0];
  const handler = createHandler({ now: () => now, read: async () => {
    if (++calls > 1) throw Error('upstream');
    return [row];
  }});
  const request = new Request('https://lab.invalid/api/classes');
  assert.equal((await (await handler(request, {})).json()).dataState, 'ready');
  now += 59000;
  assert.equal((await (await handler(request, {})).json()).canRequest, true);
  assert.equal(calls, 1);
  now += 1000;
  const stale = await (await handler(request, {})).json();
  assert.equal(stale.dataState, 'stale');
  assert.equal(stale.canRequest, false);
  now += 86400000;
  assert.equal((await handler(request, {})).status, 503);
  const empty = await createHandler({ read: async () => [] })(request, {});
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).sessions, []);
});
