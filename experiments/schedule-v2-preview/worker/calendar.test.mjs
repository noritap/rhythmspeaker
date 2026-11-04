import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHandler, project } from './calendar.mjs';

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
    assert.deepEqual(await publish(rows), []);
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
const request = new Request('https://lab.invalid/api/classes');
const env = { RS_PUBLICATION_APPROVED: 'true' };

test('approval revocation ignores legacy cache and blocks the calendar read', async () => {
  let reads = 0;
  const handler = createHandler({ now: () => time, read: async () => {
    reads++;
    return publish([event]);
  }});
  assert.equal((await handler(request, env)).status, 200);
  const oldCache = { match() { assert.fail('Legacy cache must never be consulted'); } };
  for (const approval of [undefined, 'false', 'TRUE']) {
    const result = await handler(request, { RS_PUBLICATION_APPROVED: approval }, oldCache);
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await result.json(), {
      source: 'google_calendar', dataState: 'unavailable', canRequest: false,
      lastSuccessfulSyncAt: null, sessions: []
    });
  }
  assert.equal(reads, 1);
});

test('warm and cold instances never replay private or deleted events', async () => {
  let events = [event];
  const read = async () => {
    if (!events) throw Error('upstream');
    return publish(events);
  };
  const warm = createHandler({ now: () => time, read });
  const cold = createHandler({ now: () => time, read });
  assert.equal((await (await warm(request, env)).json()).sessions.length, 1);
  for (const current of [
    [{ ...event, visibility: 'private' }], [{ ...event, visibility: 'confidential' }],
    [{ id: event.id, status: 'cancelled' }], [], null
  ]) {
    events = current;
    for (const handler of [warm, cold]) {
      const result = await handler(request, env);
      const body = await result.json();
      assert.equal(result.status, current ? 200 : 503);
      assert.deepEqual(body.sessions, []);
      assert.doesNotMatch(JSON.stringify(body), /古庄|STEP/);
    }
  }
});

test('unknown events are omitted and recognized lessons follow the admission rules', async () => {
  const titles = ['打ち合わせ', '打ち合わせ｜60m｜古庄｜OPEN', 'TAP｜古庄',
    'TAP｜60m｜古庄', 'TAP｜60m', 'TAP｜60m｜古庄｜CANCELLED'];
  const rows = await publish(titles.map((summary, i) => ({
    ...event, id: String(i), recurringEventId: undefined, originalStartTime: undefined, summary
  })));
  assert.deepEqual(rows.map(x => x.publicStatus), ['OPEN', 'INQUIRY_ONLY', 'CANCELLED']);
});

test('the browser admission guard rejects cancellation immediately before handoff', async () => {
  const [session] = await publish([event]);
  let events = [event];
  const handler = createHandler({ now: () => time, read: () => publish(events) });
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const source = html.slice(html.indexOf('async function confirmSession'), html.indexOf('function openDetail'));
  const confirm = runInNewContext(source + '\nconfirmSession', {
    AbortSignal, fetch: () => handler(request, env)
  });
  await confirm(session);
  events = [{ ...event, summary: 'STEP🔰｜60m｜古庄｜CANCELLED' }];
  await assert.rejects(confirm(session));
  events = [{ ...event, visibility: 'private' }];
  await assert.rejects(confirm(session));
  events = [];
  await assert.rejects(confirm(session));
});
