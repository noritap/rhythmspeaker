"use strict";
// Read-only published Pages smoke. Retry for asynchronous GitHub Pages release.
const assert = require("node:assert/strict");
const root = "https://noritap.github.io/rhythmspeaker/";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function read(path, stamp) {
  const response = await fetch(root + path + "?pricing-v3=" + encodeURIComponent(stamp), {
    signal: AbortSignal.timeout(14000), cache: "no-store", headers: { "Cache-Control": "no-cache" }
  });
  assert(response.ok, path + " HTTP " + response.status);
  return response.text();
}
(async () => {
  const stamp = process.env.GITHUB_SHA || String(Date.now());
  let last;
  for (let attempt = 1; attempt <= 24; attempt++) {
    try {
      const [html, js, css] = await Promise.all([
        read("pricing/", stamp + "-" + attempt),
        read("assets/ux-lab/app.js", stamp + "-" + attempt),
        read("assets/ux-lab/app.css", stamp + "-" + attempt)
      ]);
      assert(html.includes("20261105pricing-ux-v3"), "new public HTML not deployed");
      assert(html.includes("初回体験の内容・申し込みへ"), "new comparison not live");
      assert(js.includes("初回体験の内容・申し込みへ"), "SPA old copy still live");
      assert(css.includes("Pricing UX v3"), "responsive CSS not live");
      assert.equal((html.match(/class="pricing-entry-card /g)||[]).length, 2);
      assert.equal((html.match(/<details><summary>/g)||[]).length, 3);
      assert.equal((html.match(/月額契約なし/g)||[]).length, 1);
      assert.equal((html.match(/class="text-link pricing-wallet-link"/g)||[]).length, 1);
      assert(html.includes("スタジオから「予約確定」の返信"), "booking confirmation removed");
      assert(!html.includes("01 / FIRST LESSON"), "old duplicated section still live");
      for (const name of ["スタンダード10", "プレミアム25", "プレミアム50"]) {
        assert(html.includes(name) && js.includes(name), "missing plan " + name);
      }
      assert.equal((html.match(/line\.me\/R\/oaMessage\/%40ypk3334t/g)||[]).length, 3, "plan LINE intents lost");
      console.log(JSON.stringify({ status: "PASS", production: root + "pricing/", attempts: attempt, checks: [
        "published HTML", "SPA", "CSS", "2-card prices", "3 FAQ", "no repeated monthly terms",
        "selected-plan intents", "booking integrity"
      ] }));
      return;
    } catch (err) {
      last = err;
      if (attempt < 24) await sleep(10000);
    }
  }
  throw last;
})().catch(err => { console.error("PRICING LIVE SMOKE FAILED", err); process.exitCode = 1; });
