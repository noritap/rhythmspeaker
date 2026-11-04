"use strict";
// Browser-independent production smoke: static Pages HTML and live JS, read-only GET only.
// Pages deployment can lag behind the main push; retry before treating as failed.
const assert = require("node:assert/strict");
const root = "https://noritap.github.io/rhythmspeaker/";
const marker = "初めてなら、まず1,000円で体験";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function textAt(path, stamp) {
  const response = await fetch(root + path + "?pricing-smoke=" + encodeURIComponent(stamp), {
    signal: AbortSignal.timeout(14000), cache: "no-store",
    headers: { "Cache-Control": "no-cache" }
  });
  assert.equal(response.ok, true, path + " HTTP " + response.status);
  return response.text();
}
(async () => {
  const stamp = process.env.GITHUB_SHA || String(Date.now());
  let last;
  for (let attempt = 1; attempt <= 24; attempt++) {
    try {
      const [html, js] = await Promise.all([
        textAt("pricing/", stamp + "-" + attempt),
        textAt("assets/ux-lab/app.js", stamp + "-" + attempt)
      ]);
      assert(html.includes(marker), "new pricing HTML not published yet");
      assert(js.includes(marker), "new SPA pricing copy not published yet");
      assert(!js.includes("現行の正式な有効期限条件は確認が必要です"));
      assert(!html.includes("現行の正式な有効期限条件は確認が必要です"));
      assert.equal((html.match(/<details><summary>/g) || []).length, 5, "static FAQ not yet updated");
      assert(js.includes('class="pricing-faq-contact"') || js.includes('class=\"pricing-faq-contact\"'),
        "SPA missing one support call-to-action");
      assert.equal((html.match(/line\.me\/R\/oaMessage\/%40ypk3334t/g) || []).length, 3,
        "missing plan-specific LINE links");
      assert.equal((js.match(/line\.me\/R\/oaMessage\/%40ypk3334t/g) || []).length, 3,
        "SPA missing plan-specific LINE links");
      const css = await textAt("assets/ux-lab/app.css", stamp + "-" + attempt);
      assert(css.includes(".pricing-faq-contact"), "FAQ visual CSS not yet live");
      console.log(JSON.stringify({ status: "PASS", attempts: attempt, production: root + "pricing/", checks: [
        "new public HTML", "SPA renderer", "5 FAQ answers", "3 selected-plan LINE intents",
        "published CSS", "no expired placeholder" ] }));
      return;
    } catch (error) {
      last = error;
      if (attempt < 24) await sleep(10000);
    }
  }
  throw last || new Error("Pricing live smoke failed");
})().catch(error => { console.error("PRICING LIVE SMOKE FAILED", error); process.exitCode = 1; });