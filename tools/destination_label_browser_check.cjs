"use strict";
// Read-only six-width test of link labels and navigation destinations. No form submissions.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const origin = process.env.RS_LABEL_BASE || "http://127.0.0.1:8123/rhythmspeaker/";
const widths = [320, 375, 390, 430, 768, 1440];
const urls = ["", "classes/", "trial/"];
const oldLabels = [
  "通常レッスンの料金・通い方を見る",
  "体験後の料金・通い方を見る",
  "通常クラスの開催予定・予約相談を見る"
];
const directory = "ux-evidence/destination-labels";
fs.mkdirSync(directory, { recursive: true });
const normalized = s => s.replace(/\s+/g, " ").trim();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 850 } });
      const page = await context.newPage();
      try {
        for (const route of urls) {
          const errors = [];
          page.on("pageerror", e => errors.push(e.message));
          const res = await page.goto(origin + route, { waitUntil: "load", timeout: 30000 });
          assert.equal(res?.status(), 200, "HTTP failure: " + route);
          const links = await page.locator("main a").evaluateAll(anchors => anchors.map(a => ({
            label: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href")
          })));
          assert(links.some(l => l.label === "料金・通い方を見る →" &&
            /(?:^|\/)pricing\/|#\/pricing/.test(l.href)),
            route + " should link to 料金・通い方");
          if (route === "classes/") {
            assert(links.some(l => l.label === "レッスン日程を見る →" &&
              /(?:^|\/)schedule\/|#\/schedule/.test(l.href)),
              "classes page should link to レッスン日程");
          }
          const bodyText = normalized(await page.locator("main").innerText());
          for (const old of oldLabels)
            assert(!bodyText.includes(old), "obsolete label: " + old + " on " + route);
          const metrics = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth
          }));
          assert(metrics.scrollWidth <= metrics.viewport + 1,
            "horizontal overflow: " + route + " @ " + width);
          assert.deepEqual(errors, [], "JS exception: " + route + " @ " + width);
          if (width === 390 || width === 1440)
            await page.screenshot({ path: directory + "/" + (route || "home").replace(/\//g, "-") +
              "-" + width + ".png", fullPage: true });
          results.push({ route, width, pricing: "PASS", schedule: route === "classes/" ? "PASS" : null,
            ...metrics });
          page.removeAllListeners("pageerror");
        }
      } finally {
        await context.close();
      }
    }
    // Follow the changed CTA without submitting forms or contacting external services.
    const context = await browser.newContext({ viewport: { width: 390, height: 850 } });
    const page = await context.newPage();
    try {
      await page.goto(origin + "classes/", { waitUntil: "load" });
      await page.locator("main a").filter({ hasText: "料金・通い方を見る" }).first().focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(/(?:\/pricing\/|#\/pricing)/, { timeout: 12000 });
      assert.match(await page.locator("main").innerText(), /料金・通い方/);
    } finally { await context.close(); }
    fs.writeFileSync(directory + "/result.json", JSON.stringify(results, null, 2));
    console.log("PASS: destination-aligned CTA text on three pages, six widths, keyboard link route, no overflow.");
  } finally { await browser.close(); }
})().catch(e => { console.error("Destination Label Browser QA FAILED", e); process.exitCode = 1; });
