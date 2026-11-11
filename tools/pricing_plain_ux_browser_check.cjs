"use strict";
// Read-only pricing QA: test six widths, contract prices, keyboard FAQ, static/SPA parity.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.RS_PRICING_BASE_URL || "http://127.0.0.1:8020/rhythmspeaker/";
const artifact = "ux-evidence/pricing-plain";
fs.mkdirSync(artifact, { recursive: true });

const plans = [
  { id: "standard10", label: "スタンダード10", yen: "30,000", tips: "35,000", bonus: "+5,000", lessons: 10 },
  { id: "premium25", label: "プレミアム25", yen: "68,750", tips: "87,500", bonus: "+18,750", lessons: 25 },
  { id: "premium50", label: "プレミアム50", yen: "125,000", tips: "175,000", bonus: "+50,000", lessons: 50 }
];

function sourceContracts() {
  const html = fs.readFileSync("pricing/index.html", "utf8");
  const js = fs.readFileSync("assets/ux-lab/app.js", "utf8");
  const menuScript = /assets\/ux-lab\/app\.js\?v=[a-z0-9]+/i;
  const homeScript = fs.readFileSync("index.html", "utf8").match(menuScript)?.[0];
  assert(homeScript, "shared JavaScript must have a cache stamp");
  assert.equal(html.match(menuScript)?.[0]?.split("?")[0], homeScript.split("?")[0], "pricing must load the same shared script as home");
  for (const plan of plans) {
    const block = html.match(new RegExp('<article class="plan-card" data-plan="' + plan.id + '">([\\s\\S]*?)</article>'))?.[1];
    assert(block, plan.id + " missing");
    for (const value of [plan.yen, plan.tips, plan.bonus, "通常レッスン <strong>" + plan.lessons + "回</strong>"]) {
      assert(block.includes(value), plan.id + " mismatches official Wallet master: " + value);
    }
    assert(block.includes("line.me/R/oaMessage/%40ypk3334t/"), plan.id + " lost selected-plan LINE intent");
    assert(js.includes(plan.yen) && js.includes(plan.tips) && js.includes(plan.bonus), "SPA plan drift " + plan.id);
  }
  assert(html.indexOf('class="pricing-system"') < html.indexOf('class="pricing-entry-grid"'));
  assert.equal((html.match(/class="pricing-entry-card /g)||[]).length, 2, "first/normal fees should be in two cards");
  assert.equal((html.match(/<details><summary>/g)||[]).length, 3, "remove duplicated monthly/booking FAQ entries");
  assert.equal((html.match(/月額契約なし/g)||[]).length, 1, "monthly terms must not be duplicated");
  assert.equal((html.match(/href="https:\/\/tips-app-seven.vercel.app\//g)||[]).length >= 1, true);
  assert.equal((html.match(/class="text-link pricing-wallet-link"/g)||[]).length, 1);
  assert(!html.includes("01 / FIRST LESSON") && !html.includes("VISITOR CHARGE"));
  assert(html.includes("シューズ・ウェア無料レンタル"));
  assert(html.includes("スタジオから「予約確定」の返信"), "booking must remain explicit");
  assert(html.includes("有効期限はこのページでは明記していません"), "unknown legal terms must remain caveated");
  assert(html.includes("400 TIPS") && html.includes("3,500 TIPS"), "studio prices are still discoverable");
}

function signature() {
  return {
    text: document.querySelector("main")?.textContent.replace(/\s+/g, "").trim(),
    links: [...document.querySelectorAll("main a")].map(a => a.href)
  };
}

(async () => {
  sourceContracts();
  const browser = await chromium.launch({ headless: true });
  const widths = [320, 375, 390, 430, 768, 1440];
  const reports = [];
  let dynamicSignature;
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 850 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(base + "pricing/", { waitUntil: "networkidle", timeout: 45000 });
      assert.equal(await page.locator("h1").innerText(), "料金・通い方");
      assert.equal(await page.locator(".pricing-entry-card").count(), 2);
      assert.equal(await page.locator(".plan-card").count(), 3);
      assert.equal(await page.locator(".pricing-faq details").count(), 3);
      assert.equal(await page.locator(".pricing-system").count(), 1);
      assert.equal(await page.locator(".pricing-wallet-link").count(), 1);
      assert.equal(await page.locator(".pricing-entry-first .pricing-entry-price strong").innerText(), "1,000");
      assert.equal(await page.locator(".pricing-entry-regular .pricing-entry-price strong").innerText(), "3,500");
      assert(await page.locator("html").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "horizontal overflow " + width);
      assert.deepEqual(errors, [], "page JS error at " + width);
      assert.equal(await page.locator(".plan-card a[href*='oaMessage']").count(), 3);
      for (const plan of plans) {
        const href = await page.locator('.plan-card[data-plan="' + plan.id + '"] a').getAttribute("href");
        assert(decodeURIComponent(href).includes(plan.label), plan.id + " LINE prefill must name selected plan");
      }
      assert.equal(await page.locator(".pricing-entry-regular a[href$='/schedule/']").count(), 1);
      if (width === 390) dynamicSignature = await page.evaluate(signature);
      const faq = page.locator(".pricing-faq details").first();
      await faq.locator("summary").focus();
      await page.keyboard.press("Enter");
      assert(await faq.evaluate(el => el.open), "FAQ must open by keyboard");
      await page.keyboard.press("Enter");
      assert(!(await faq.evaluate(el => el.open)), "FAQ must close by keyboard");
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: artifact + "/pricing-" + width + ".png", fullPage: true });
        await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
        const violations = await page.evaluate(async () => {
          const result = await axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
          return result.violations.map(v => ({ id: v.id, impact: v.impact, target: v.nodes.slice(0, 4).map(n => n.target) }));
        });
        assert.deepEqual(violations, [], "Accessibility failure " + width);
      }
      reports.push({ width, result: "PASS" });
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 850 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + "pricing/", { waitUntil: "domcontentloaded" });
    assert.deepEqual(await page.evaluate(signature), dynamicSignature, "static HTML and SPA must have identical copy and links");
    await context.close();
    console.log(JSON.stringify({ status: "PASS", base, widths: reports, guarantees: [
      "five official prices and bonuses", "two primary fee cards", "three meaningful FAQ items", "one Wallet CTA",
      "selected plan LINE intent", "keyboard", "WCAG 2.1AA at mobile/desktop",
      "zero horizontal overflow", "static SPA parity", "zero external submissions"
    ] }));
  } finally {
    await browser.close();
  }
})().catch(err => { console.error("PRICING UX v3 QA FAILED", err); process.exitCode = 1; });
