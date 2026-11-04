"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const base = process.env.RESERVATION_BASE_URL || "http://127.0.0.1:8020/";
const folder = "ux-evidence/workshop-recommendations";
fs.mkdirSync(folder, { recursive: true });
const fixture = [
  { slug: "sakaida-koji-20261122", title: "サカイダコージ TAP DANCE WORKSHOP",
    instructor: "サカイダコージ", date: "2026-11-22", status: "published", registration_close_at: null,
    workshop_sessions: [{ name: "タップダンス ワークショップ", active: true, price: 3000, start_time: "15:00:00" }] },
  { slug: "draft-20261112", title: "非公開", date: "2026-11-12", status: "draft",
    workshop_sessions: [{ active: true, price: 2000 }] },
  { slug: "closed-20261118", title: "受付終了", date: "2026-11-18", status: "published",
    registration_close_at: "2026-11-03T08:00:00+09:00", workshop_sessions: [{ active: true, price: 3000 }] },
  { slug: "inactive-20261128", title: "開催なし", date: "2026-11-28", status: "published",
    workshop_sessions: [{ active: false, price: 3000 }] }
];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 375, 390, 430, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const diagnostics = { requests: [], failures: [], errors: [], console: [] };
      page.on("request", request => { if (request.url().includes("supabase.co")) diagnostics.requests.push({ method: request.method(), url: request.url() }); });
      page.on("requestfailed", request => diagnostics.failures.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on("pageerror", error => diagnostics.errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") diagnostics.console.push(message.text()); });
      await page.clock.install({ time: new Date("2026-11-04T11:00:00.000Z") });
      await page.route("**/rest/v1/workshop_events**", async route => {
        const headers = {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "apikey, accept",
          "access-control-allow-methods": "GET, OPTIONS"
        };
        const req = route.request();
        if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
        assert.equal(req.method(), "GET");
        assert.equal(req.url().includes("status=eq.published"), true);
        return route.fulfill({ status: 200, headers, json: fixture });
      });
      await page.goto(base + "schedule/");
      const section = page.locator("#rs-workshop-recommendations");
      try { await section.waitFor({ state: "visible", timeout: 10000 }); } catch (error) {
        console.error("Recommendation diagnostics", JSON.stringify({ width, diagnostics,
          state: await page.evaluate(() => ({ hasSection: !!document.querySelector("#rs-workshop-recommendations"),
            sectionHidden: document.querySelector("#rs-workshop-recommendations")?.hidden,
            config: window.RS_WORKSHOP_CONFIG ? { mode: window.RS_WORKSHOP_CONFIG.mode, url: window.RS_WORKSHOP_CONFIG.supabaseUrl, keyPrefix: String(window.RS_WORKSHOP_CONFIG.supabasePublishableKey).slice(0, 15) } : null,
            scriptFound: [...document.scripts].some(s => s.src.includes("workshop-recommendations.js"))
          })) }, null, 2));
        await page.screenshot({ path: folder + "/failure-" + width + ".png", fullPage: true });
        throw error;
      }
      assert.equal(await page.locator(".ws-reco-card").count(), 1, "must show only eligible event");
      assert.match(await section.innerText(), /サカイダコージ/);
      assert.match(await section.innerText(), /3,000/);
      assert.equal(await page.locator(".ws-reco-link").getAttribute("href"),
        base + "workshops/event.html?slug=sakaida-koji-20261122");
      assert(await page.locator(".ws-reco-link").isVisible());
      assert(await page.locator("html").evaluate(el => el.scrollWidth <= el.clientWidth + 1),
        width + " px: horizontal scroll");
      if (width === 390) await page.screenshot({ path: folder + "/card-390.png", fullPage: true });
      await page.close();
    }
    const failed = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await failed.clock.install({ time: new Date("2026-11-04T11:00:00.000Z") });
    await failed.route("**/rest/v1/workshop_events**", async route => {
      const headers = { "access-control-allow-origin": "*",
        "access-control-allow-headers": "apikey, accept",
        "access-control-allow-methods": "GET, OPTIONS" };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      return route.fulfill({ status: 503, headers, body: "{}" });
    });
    const failResponse = failed.waitForResponse(r => r.url().includes("/rest/v1/workshop_events") && r.request().method() === "GET");
    await failed.goto(base + "schedule/");
    await failResponse;
    assert(await failed.locator("#rs-workshop-recommendations").isHidden(),
      "recommender must fail closed on API error");
    assert(await failed.locator('[data-cf-mode="request"]').isVisible(),
      "core lesson booking must remain usable on recommendation failure");
    await failed.close();
    console.log(JSON.stringify({ outcome: "PASS", widths: [320, 375, 390, 430, 768, 1440],
      scenarios: ["published only", "JST current month", "valid booking link", "no horizontal overflow", "failed API hidden"] }));
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });