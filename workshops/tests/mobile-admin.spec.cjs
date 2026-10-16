const { test, expect } = require('@playwright/test');
const path = require('node:path');
const url = 'file://' + path.resolve(__dirname, '../admin/index.html');
const widths = [320, 375, 390, 438, 476, 485];

async function renderFixture(page) {
  await page.goto(url);
  await page.evaluate(() => {
    document.querySelector('#loginView').classList.add('hidden');
    document.querySelector('#adminView').classList.remove('hidden');
    document.querySelector('#dashboardPane').classList.add('hidden');
    const pane = document.querySelector('#reservationsPane');
    pane.classList.remove('hidden');
    pane.innerHTML = `
      <h1>参加予定者名簿</h1>
      <section class="reservation-controls">
        <div class="filter-chips"><button class="filter-chip">全予約 16</button><button class="filter-chip">初級クラス 7</button><button class="filter-chip">未入金 0</button></div>
        <label class="reservation-search">氏名検索<input placeholder="氏名・メール"></label>
      </section>
      <div class="roster-groups"><section class="roster-class">
        <div class="roster-heading"><div><h3>初級＋中級セットの参加者名簿</h3><small>WORKSHOP</small></div><div class="roster-heading-stats"><strong>7名</strong><small>未入金 0名</small></div></div>
        <ol class="roster-list">
          <li class="roster-person">
            <div class="roster-person-main"><strong>【TEST】長い参加者氏名・表示検証</strong><span>初級＋中級セット</span></div>
            <div class="roster-person-side"><span>入金済</span><small>未受付</small></div>
            <div class="roster-person-actions"><button type="button" class="smallbtn">入金確認</button><button type="button" class="smallbtn">受付する</button></div>
          </li>
        </ol>
      </section></div>`;
  });
}
for (const width of widths) {
  test('mobile roster and actions fully visible at ' + width + 'px', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await renderFixture(page);
    await expect(page.locator('.roster-person-actions button')).toHaveCount(2);
    const violations = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      const selectors = ['.admin-main','#reservationsPane','.reservation-controls','.roster-class','.roster-person','.roster-person-actions button'];
      return selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(el => {
        const r = el.getBoundingClientRect();
        return { selector, left: r.left, right: r.right };
      })).filter(x => x.left < -1 || x.right > limit + 1);
    });
    expect(violations).toEqual([]);
    const widthInfo = await page.evaluate(() => ({ viewport: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(widthInfo.doc).toBeLessThanOrEqual(widthInfo.viewport + 1);
    expect(widthInfo.body).toBeLessThanOrEqual(widthInfo.viewport + 1);
    await page.close();
  });
}
test('thumb navigation remains accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await renderFixture(page);
  await expect(page.locator('#navAllReservationsBtn')).toBeVisible();
  await expect(page.locator('#navLogoutBtn')).toBeVisible();
  const r = await page.locator('#adminQuickNav').boundingBox();
  expect(r.y + r.height).toBeGreaterThan(800);
});
