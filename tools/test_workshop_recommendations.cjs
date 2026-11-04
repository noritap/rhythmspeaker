"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { tokyoDate, selectUpcoming, minPrice, getPublishedEvents } = require("../assets/ux-lab/workshop-recommendations.js");
const now = new Date("2026-11-04T11:00:00Z"); // 20:00 JST
function event(overrides = {}) {
  return {
    slug: "sakaida-koji-20261122", title: "サカイダコージ WS",
    instructor: "サカイダコージ", date: "2026-11-22", status: "published",
    registration_close_at: null,
    workshop_sessions: [{ active: true, name: "TAP", price: 3000, start_time: "15:00:00" }],
    ...overrides
  };
}
test("Asia/Tokyo date is independent of system timezone", () => {
  assert.equal(tokyoDate(now), "2026-11-04");
  assert.equal(tokyoDate(new Date("2026-11-30T15:01:00Z")), "2026-12-01");
});
test("eligible events are chronological, limited to two", () => {
  const rows = [event({ slug: "later", date: "2026-11-29" }),
    event({ slug: "earlier", date: "2026-11-06" }), event()];
  assert.deepEqual(selectUpcoming(rows, now).map(e => e.slug), ["earlier", "sakaida-koji-20261122"]);
});
test("past, next month, drafts, invalid slugs and no active sessions are excluded", () => {
  assert.deepEqual(selectUpcoming([
    event({ date: "2026-11-03" }),
    event({ date: "2026-12-01" }),
    event({ status: "draft" }),
    event({ slug: "malicious?query=x" }),
    event({ workshop_sessions: [{ active: false, price: 3000 }] })
  ], now), []);
});
test("closed registration and invalid deadline fail closed", () => {
  assert.deepEqual(selectUpcoming([
    event({ registration_close_at: "2026-11-04T10:00:00Z" }),
    event({ registration_close_at: "invalid" })
  ], now), []);
});
test("today's event is promoted only before its active class starts", () => {
  const rows = [
    event({ slug: "early", date: "2026-11-04", workshop_sessions: [{ active: true, start_time: "19:00:00", price: 3000 }] }),
    event({ slug: "late", date: "2026-11-04", workshop_sessions: [{ active: true, start_time: "21:00:00", price: 3000 }] })
  ];
  assert.deepEqual(selectUpcoming(rows, now).map(e => e.slug), ["late"]);
});
test("minimum active positive price is used, not an inactive or placeholder price", () => {
  const row = event({ workshop_sessions: [
    { active: false, price: 1000 }, { active: true, price: 4000 },
    { active: true, price: 3000 }, { active: true, price: 0 }
  ] });
  assert.equal(minPrice(row, now), 3000);
});
test("public API is read-only and queries current month's published rows", async () => {
  let called, opts;
  const rows = [event()];
  const fetcher = async (url, options) => {
    called = new URL(url); opts = options;
    return { ok: true, json: async () => rows };
  };
  const cfg = { mode: "live", supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "sb_publishable_test" };
  assert.deepEqual(await getPublishedEvents(cfg, now, fetcher), rows);
  assert.equal(opts.method, "GET");
  assert.equal(opts.credentials, "omit");
  assert.equal(called.pathname, "/rest/v1/workshop_events");
  assert.equal(called.searchParams.get("status"), "eq.published");
  assert.deepEqual(called.searchParams.getAll("date"), ["gte.2026-11-04", "lt.2026-12-01"]);
  assert.ok(called.searchParams.get("select").includes("workshop_sessions("));
});
test("invalid keys and non-200 API responses do not yield recommendations", async () => {
  await assert.rejects(getPublishedEvents(
    { mode: "live", supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "service_secret" },
    now, async () => { throw new Error("must not call"); }
  ));
  await assert.rejects(getPublishedEvents(
    { mode: "live", supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "sb_publishable_test" },
    now, async () => ({ ok: false })
  ));
});