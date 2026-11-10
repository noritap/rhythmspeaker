"use strict";
// Read-only Playwright QA for STEP duplication reduction. No submissions or backend writes.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const widths = [320, 375, 390, 430, 768, 1440];
const origins = [
  ["before", "http://127.0.0.1:8001"],
  ["after", "http://127.0.0.1:8002"]
];
const evidenceDir = "ux-evidence/step-clarity";
fs.mkdirSync(evidenceDir, {recursive: true});

(async () => {
  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const [phase, origin] of origins) {
      for (const width of widths) {
        const context = await browser.newContext({viewport: {width, height: 850}, deviceScaleFactor: 1});
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", err => errors.push(err.message));
        try {
          const response = await page.goto(origin + "/classes/step/", {waitUntil: "load", timeout: 30000});
          assert.equal(response?.status(), 200, phase + ": HTTP status at " + width);
          const title = await page.locator("h1").first().innerText();
          assert.match(title, /一音から/);
          const count = await page.locator('a[href="../../trial/apply/?class=STEP"]').count();
          assert.equal(count, phase === "before" ? 7 : 4, phase + ": expected STEP application link count");
          for (const id of ["levels", "start", "instructors", "faq", "booking"]) {
            assert.equal(await page.locator("#" + id).count(), 1, phase + ": missing " + id);
          }
          const size = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            document: document.documentElement.scrollWidth
          }));
          if (phase === "after") {
            assert(size.document <= size.viewport + 1, "horizontal scroll at width " + width);
            assert.deepEqual(errors, [], "JavaScript errors at " + width);
            assert.equal(await page.locator('#method').count(), 0, "duplicate learning section must be absent");
            assert(await page.getByText("日時は送信時点では未確定").count() > 0, "booking safety note must remain");
            const apply = page.locator('#start a[href="../../trial/apply/?class=STEP"]');
            assert.equal(await apply.count(), 1, "primary application CTA must remain");
            const schedule = page.locator('a[href="../../schedule/?type=STEP"]').first();
            assert(await schedule.isVisible(), "filtered class schedule must remain");
            assert.equal(await page.locator('a[href="../tap/"]').count(), 1, "TAP progression link must remain");
            await page.locator('.class-jump a[href="#start"]').focus();
            await page.keyboard.press("Enter");
            assert(page.url().endsWith("#start"), "keyboard activation of in-page navigation");
            const question = page.locator('#faq details').last();
            await question.locator("summary").focus();
            await page.keyboard.press("Enter");
            assert(await question.evaluate(el => el.open), "FAQ opens from keyboard");
            await page.keyboard.press("Enter");
            assert(!(await question.evaluate(el => el.open)), "FAQ closes from keyboard");
            if (width === 390 || width === 1440) {
              await page.addScriptTag({path: require.resolve("axe-core/axe.min.js")});
              const violations = await page.evaluate(async () => {
                const audit = await axe.run("main", {
                  runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"]}
                });
                return audit.violations.map(v => ({rule: v.id, impact: v.impact,
                  elements: v.nodes.slice(0, 4).map(n => n.target)}));
              });
              assert.deepEqual(violations, [], "WCAG 2.1AA issues at width " + width);
            }
          }
          await page.screenshot({path: evidenceDir + "/" + phase + "-" + width + ".png", fullPage: true});
          results.push({phase, width, applicationLinks: count, ...size, errors, status: "PASS"});
        } finally {
          await context.close();
        }
      }
    }
    fs.writeFileSync(evidenceDir + "/report.json", JSON.stringify(results, null, 2));
    console.log("STEP 6-width Chromium, keyboard, CTA, accessibility and screenshots: PASS");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error("STEP browser QA failed:", error);
  process.exitCode = 1;
});
