"use strict";
// Isolated local/PR browser test. No external LINE messages, Wallet writes or payment actions.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.RS_PRICING_BASE_URL || "http://127.0.0.1:8020/rhythmspeaker/";
const artifact = "ux-evidence/pricing-plain";
fs.mkdirSync(artifact, { recursive: true });

function sourceContracts() {
  const html = fs.readFileSync("pricing/index.html", "utf8");
  const master = [
    { id: "standard10", yen: "30,000", tips: "35,000", bonus: "+5,000", lessons: 10 },
    { id: "premium25", yen: "68,750", tips: "87,500", bonus: "+18,750", lessons: 25 },
    { id: "premium50", yen: "125,000", tips: "175,000", bonus: "+50,000", lessons: 50 }
  ];
  for (const plan of master) {
    const block = html.match(new RegExp('<article class="plan-card" data-plan="' + plan.id + '">([\\s\\S]*?)</article>'))?.[1];
    assert(block, plan.id + " is missing");
    for (const amount of [plan.yen, plan.tips, plan.bonus]) assert(block.includes(amount), plan.id + " mismatches Wallet master " + amount);
    assert(block.includes("通常レッスン <strong>" + plan.lessons + "回</strong>"));
    assert(block.includes("line.me/R/oaMessage/%40ypk3334t/"), "Plan contact CTA must preserve selected name");
  }
  assert(html.includes("初回体験 1,000円"));
  assert(html.includes("通常1回 3,500円（ビジター）"));
  assert(html.includes("3,500 TIPS"));
  assert(html.includes("400 TIPS") && html.includes("3,500 TIPS"), "rental rates must remain");
  assert(html.includes("チャージ前に対象プランの期限と利用条件"), "terms must be transparent");
  assert(!html.includes("現行の正式な有効期限条件は確認が必要です"), "internal note in public copy");
  assert(!html.includes("04 / YOUR PACE"), "redundant section should be removed");
  assert.equal((html.match(/<details><summary>/g) || []).length, 5, "FAQ must contain five useful questions");
  assert(html.includes("スタジオからの「予約確定」返信後"), "booking state preserved");
}

(async () => {
  sourceContracts();
  const browser = await chromium.launch({ headless: true });
  const widths = [320, 375, 390, 430, 768, 1440];
  const reports = [];
  let runtimeSignature;
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 810 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(base + "pricing/", { waitUntil: "domcontentloaded", timeout: 30000 });
      assert.equal(await page.locator("h1").innerText(), "料金・通い方");
      assert.equal(await page.locator(".plan-card").count(), 3);
      assert.equal(await page.locator(".pricing-faq details").count(), 5);
      assert(await page.locator("html").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "horizontal page overflow " + width);
      assert.equal(errors.length, 0, "page javascript errors at " + width + ": " + errors.join(", "));
      assert.equal(await page.locator(".pricing-faq-contact .text-link").count(), 1);
      assert.equal(await page.locator(".plan-card a[href*='oaMessage']").count(), 3);
      if (width === 390) runtimeSignature = await page.evaluate(() => ({
        proof: document.querySelector(".pricing-proof")?.textContent.replace(/\s+/g, ""),
        priceSections: [...document.querySelectorAll("main .pricing-section")].map(n => n.textContent.replace(/\s+/g, "")),
        planLinks: [...document.querySelectorAll(".plan-card a")].map(n => n.href)
      }));
      const links = await page.locator(".plan-card a").evaluateAll(items => items.map(a => a.href));
      assert(links.every(href => href.includes("line.me/R/oaMessage/%40ypk3334t/")));
      assert.equal(await page.getByText("有効期限は、このページでは明記していません。", { exact: false }).count(), 1);
      // FAQ uses actual native details/summary and can be operated by keyboard.
      const faq = page.locator(".pricing-faq details").first();
      await faq.locator("summary").focus();
      await page.keyboard.press("Enter");
      assert(await faq.evaluate(el => el.open), "keyboard must open FAQ " + width);
      await page.keyboard.press("Enter");
      assert(!(await faq.evaluate(el => el.open)), "keyboard must close FAQ " + width);
      // Verify business-sensitive CTAs but never follow LINE or submit anything.
      assert((await page.locator(".pricing-single a[href$='/schedule/']").count()) === 1);
      assert((await page.locator(".wallet-explanation a[href='https://tips-app-seven.vercel.app/']").count()) === 1);
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: artifact + "/pricing-" + width + ".png", fullPage: true });
        await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
        const violations = await page.evaluate(async () => {
          const result = await axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
          return result.violations.map(item => ({ id: item.id, impact: item.impact, elements: item.nodes.map(n => n.target).slice(0, 5) }));
        });
        assert.deepEqual(violations, [], "Pricing main accessibility failure at " + width + "px");
      }
      reports.push({ width, status: "PASS" });
      await context.close();
    }
    // Prove static no-JavaScript copy agrees with the dynamically rendered content.
    const staticContext = await browser.newContext({ viewport: { width: 390, height: 810 }, javaScriptEnabled: false });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(base + "pricing/", { waitUntil: "domcontentloaded" });
    const noJsSignature = await staticPage.evaluate(() => ({
      proof: document.querySelector(".pricing-proof")?.textContent.replace(/\s+/g, ""),
      priceSections: [...document.querySelectorAll("main .pricing-section")].map(n => n.textContent.replace(/\s+/g, "")),
      planLinks: [...document.querySelectorAll(".plan-card a")].map(n => n.href)
    }));
    assert.deepEqual(noJsSignature, runtimeSignature, "static and JavaScript pricing output must not drift");
    await staticContext.close();
    console.log(JSON.stringify({ status: "PASS", widths: reports, invariants: [
      "all five published prices preserved", "5 FAQ questions", "one terms CTA",
      "no internal expiry placeholder", "keyboard native FAQ", "no horizontal overflow",
      "no browser errors", "static/SPA copy parity", "no real external submissions" ] }));
  } finally {
    await browser.close();
  }
})().catch(err => { console.error("PRICING UX QA FAILED:", err); process.exitCode = 1; });
