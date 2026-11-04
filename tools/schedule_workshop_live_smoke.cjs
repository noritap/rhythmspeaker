"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { selectUpcoming, tokyoDate } = require("../assets/ux-lab/workshop-recommendations.js");
const base = "https://noritap.github.io/rhythmspeaker/";
const evidence = "ux-evidence/workshop-live";
fs.mkdirSync(evidence, { recursive: true });
function readPublicConfig() {
  const source = fs.readFileSync("workshops/config.js", "utf8");
  const url = source.match(/supabaseUrl:\s*"([^"]+)"/)?.[1];
  const key = source.match(/supabasePublishableKey:\s*"([^"]+)"/)?.[1];
  assert.match(url || "", /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
  assert.match(key || "", /^sb_publishable_/);
  return { url, key };
}
async function publicRows() {
  const { url, key } = readPublicConfig();
  const date = tokyoDate(new Date());
  const [y, month] = date.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(y, month, 1)).toISOString().slice(0, 10);
  const api = new URL(url + "/rest/v1/workshop_events");
  api.searchParams.set("select", "slug,title,instructor,date,status,registration_close_at,workshop_sessions(name,price,active,start_time)");
  api.searchParams.set("status", "eq.published");
  api.searchParams.append("date", "gte." + date);
  api.searchParams.append("date", "lt." + nextMonth);
  api.searchParams.set("order", "date.asc");
  api.searchParams.set("limit", "20");
  const response = await fetch(api, { headers: { apikey: key, Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  assert.equal(response.ok, true, "public WS REST must be reachable, HTTP " + response.status);
  const rows = await response.json();
  assert(Array.isArray(rows));
  return rows;
}
async function checkStatic() {
  const cache = "?smoke=" + Date.now();
  const schedule = await fetch(base + "schedule/" + cache, { cache: "no-store" });
  assert.equal(schedule.ok, true);
  const html = await schedule.text();
  assert(html.includes('id="rs-workshop-recommendations"'), "Pages schedule marker not yet published");
  assert(html.includes("workshop-recommendations.js"), "Pages lacks recommendation script");
  const landing = await fetch(base + "workshops/sakaida-koji-20261122.html" + cache, { cache: "no-store" });
  assert.equal(landing.ok, true);
  const page = await landing.text();
  assert(page.includes("最新の受付状況・予約を確認する"), "live workshop CTA not deployed");
  assert(!page.includes("予約受付方法・キャンセル規定は現在準備中"), "obsolete copy is still live");
}
(async () => {
  await checkStatic();
  const rows = await publicRows();
  const expected = selectUpcoming(rows, new Date());
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const failures = [], errors = [];
      page.on("requestfailed", r => { if (r.url().includes("supabase.co")) failures.push(r.failure()?.errorText); });
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(base + "schedule/?smoke=" + Date.now(), { waitUntil: "load", timeout: 30000 });
      if (expected.length) {
        await page.waitForFunction(n => document.querySelectorAll("#rs-ws-cards .ws-reco-card").length === n,
          expected.length, { timeout: 20000 });
        assert(await page.locator("#rs-workshop-recommendations").isVisible());
        assert((await page.locator(".ws-reco-link").first().getAttribute("href")).includes(
          "slug=" + encodeURIComponent(expected[0].slug)));
      } else {
        await page.waitForTimeout(1500);
        assert(await page.locator("#rs-workshop-recommendations").isHidden(),
          "no current published active WS means no recommendation cards");
      }
      assert.equal(failures.length, 0, "public WS API requests failed: " + failures.join(","));
      assert.equal(errors.length, 0, "page errors: " + errors.join(","));
      assert(await page.locator("html").evaluate(el => el.scrollWidth <= el.clientWidth + 1),
        "live layout overflow at width " + width);
      await page.screenshot({ path: evidence + "/schedule-" + width + ".png", fullPage: true });
      await page.close();
    }
    console.log(JSON.stringify({ status: "PASS", livePages: true, dateJst: tokyoDate(new Date()),
      eligiblePublishedWS: expected.map(e => e.slug), widths: [390, 1440] }));
  } finally { await browser.close(); }
})().catch(e => { console.error("LIVE WORKSHOP SMOKE FAILED", e); process.exitCode = 1; });