"use strict";
// Read-only published Pages smoke. Retry for asynchronous GitHub Pages release.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const root = "https://noritap.github.io/rhythmspeaker/";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function read(path, stamp) {
  const response = await fetch(root + path + "?pricing-v3=" + encodeURIComponent(stamp), {
    signal: AbortSignal.timeout(14000), cache: "no-store", headers: { "Cache-Control": "no-cache" }
  });
  assert(response.ok, path + " HTTP " + response.status);
  return response.text();
}
async function waitForRelease() {
  const stamp = process.env.GITHUB_SHA || String(Date.now());
  const expected = ["pricing/index.html", "assets/ux-lab/app.js", "assets/ux-lab/app.css"]
    .map(path => readFileSync(path, "utf8"));
  let last;
  for (let attempt = 1; attempt <= 56; attempt++) {
    try {
      const [html, js, css] = await Promise.all([
        read("pricing/", stamp + "-" + attempt),
        read("assets/ux-lab/app.js", stamp + "-" + attempt),
        read("assets/ux-lab/app.css", stamp + "-" + attempt)
      ]);
      for (const [i, content] of [html, js, css].entries()) {
        assert(content === expected[i], ["pricing HTML", "shared JS", "shared CSS"][i] + " differs from the checked-out release");
      }
      return {html, js, css, attempt};
    } catch (err) {
      last = err;
      if (attempt < 56) await sleep(10000);
    }
  }
  throw last;
}

(async () => {
  const {html, js, css, attempt} = await waitForRelease();
  assert(html.includes("1回から、自分のペースで通えます。"), "new comparison not live");
  assert(js.includes("1回から、自分のペースで通えます。"), "SPA old copy still live");
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
})().catch(err => { console.error("PRICING LIVE SMOKE FAILED", err); process.exitCode = 1; });
