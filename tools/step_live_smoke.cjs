"use strict";
// Read-only post-deployment contract. No messages, registrations, or paid actions.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {chromium} = require("playwright");
const base = "https://noritap.github.io/rhythmspeaker/";
const stamp = process.env.GITHUB_SHA || String(Date.now());
const pageUrl = base + "classes/step/?step-live=" + encodeURIComponent(stamp);
const evidence = "ux-evidence/step-live";
fs.mkdirSync(evidence, {recursive: true});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const widths = [320, 375, 390, 430, 768, 1440];

(async () => {
  let lastError;
  let html;
  for (let attempt = 1; attempt <= 18; attempt++) {
    try {
      const response = await fetch(pageUrl + "-" + attempt, {
        cache: "no-store", signal: AbortSignal.timeout(12000),
        headers: {"Cache-Control": "no-cache"}
      });
      assert(response.ok, "published STEP HTTP " + response.status);
      html = await response.text();
      assert(html.includes('id="step-hero-title"'), "incorrect STEP page returned");
      assert.equal(html.split('href="../../trial/apply/?class=STEP"').length - 1, 4,
        "published STEP must have exactly four application links");
      assert(!html.includes('class="step-level-decision"'), "removed duplicate CTA is still published");
      assert(!html.includes('class="step-instructor-followup"'), "redundant instructor CTA is still published");
      assert(!html.includes('id="method"'), "removed duplicate learning section is still published");
      assert(!html.includes('<span class="number">01</span>'), "decorative level numbering still published");
      assert(html.includes("日時は送信時点では未確定"), "booking warning missing");
      assert(html.includes("初回体験 ¥1,000"), "trial price missing");
      assert(html.includes("../../schedule/?type=STEP"), "STEP schedule filtered link missing");
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 18) await sleep(5000);
    }
  }
  if (lastError) throw lastError;

  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({viewport: {width, height: 850}});
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      try {
        const response = await page.goto(pageUrl, {waitUntil: "load", timeout: 30000});
        assert.equal(response?.status(), 200, "live browser HTTP at " + width);
        assert.match(await page.locator("h1").innerText(), /一音から/);
        assert.equal(await page.locator('a[href="../../trial/apply/?class=STEP"]').count(), 4);
        const size = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
          brokenImages: [...document.querySelectorAll("main img")].filter(
            x => x.complete && !x.naturalWidth
          ).length
        }));
        assert(size.document <= size.viewport + 1, "horizontal overflow at " + width);
        assert.equal(size.brokenImages, 0, "main image missing at " + width);
        assert.deepEqual(errors, [], "browser JS errors at " + width);
        for (const id of ["levels", "start", "instructors", "faq", "booking"])
          assert.equal(await page.locator("#" + id).count(), 1, "missing live anchor " + id);
        const schedule = page.locator('a[href="../../schedule/?type=STEP"]');
        assert(await schedule.first().isVisible(), "live schedule destination missing");
        await page.locator('.class-jump a[href="#start"]').focus();
        await page.keyboard.press("Enter");
        assert(page.url().endsWith("#start"), "live keyboard navigation failed");
        const faq = page.locator('#faq details').last();
        await faq.locator("summary").focus();
        await page.keyboard.press("Enter");
        assert(await faq.evaluate(el => el.open), "live FAQ keyboard open failed");
        await page.keyboard.press("Enter");
        assert(!(await faq.evaluate(el => el.open)), "live FAQ keyboard close failed");
        if (width === 390 || width === 1440) {
          await page.addScriptTag({path: require.resolve("axe-core/axe.min.js")});
          const violations = await page.evaluate(async () => {
            const audit = await axe.run("main", {
              runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"]}
            });
            return audit.violations.map(v => ({
              id: v.id, nodes: v.nodes.slice(0, 8).map(n => n.target)
            }));
          });
          assert.deepEqual(violations, [], "live WCAG 2.1 AA at width " + width);
          await page.screenshot({path: evidence + "/step-" + width + ".png", fullPage: true});
        }
        results.push({width, status: "PASS", ...size});
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(evidence + "/report.json", JSON.stringify({
    pageUrl: base + "classes/step/",
    expectedGitSha: stamp, html: "PASS", widths: results
  }, null, 2));
  console.log("PASS: production STEP HTML and six-width Chromium, keyboard, WCAG 2.1 AA. No submissions.", JSON.stringify(results));
})().catch(error => {
  console.error("LIVE STEP PUBLIC QA FAILED", error);
  process.exitCode = 1;
});
