const { test, expect } = require('@playwright/test');
const path = require('node:path');
const url = 'file://' + path.resolve(__dirname, '../admin/index.html');
const widths = [320, 375, 390, 438, 476];

for (const width of widths) {
  test('workshop admin responsive shell at ' + width + 'px', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url);
    await expect(page.locator('#loginView')).toBeVisible();
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth
    }));
    expect(overflow.document, 'document overflow at ' + width).toBeLessThanOrEqual(1);
    expect(overflow.body, 'body overflow at ' + width).toBeLessThanOrEqual(1);
    await page.close();
  });
}

test('mobile admin navigation exposes sign-out', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.evaluate(() => {
    document.querySelector('#loginView').classList.add('hidden');
    document.querySelector('#adminView').classList.remove('hidden');
  });
  await expect(page.locator('#navLogoutBtn')).toBeVisible();
  await expect(page.locator('#navLogoutBtn')).toHaveAttribute('type', 'button');
});


test('roster check-in and payment controls update only a test fixture', async ({ page }) => {
  await page.route(/\/assets\/(store|store-v2-adapter)\.js/, route => route.abort());
  await page.addInitScript(() => {
    const reservation = { id: 'QA-ONLY', eventId: 'qa-event', sessionId: 'qa-session', name: '【TEST】操作確認', amount: 0, paymentStatus: 'unpaid', checkin: false, status: 'reserved' };
    const event = { id: 'qa-event', title: '【TEST】非公開', date: '2099-01-01', sessions: [{ id: 'qa-session', name: '検証クラス', consumes: [] }] };
    window.__qaUpdates = [];
    window.RSStore = { get: async () => ({
      mode: 'demo', currentUser: async () => null,
      listEvents: async () => [event],
      listReservations: async () => [reservation],
      listWaitlist: async () => [],
      listReservationAudit: async () => [],
      getInstructorSpecialRemaining: async () => 5,
      updateReservation: async (id, patch) => {
        if (id !== 'QA-ONLY') throw Error('Unexpected reservation');
        window.__qaUpdates.push(patch);
        Object.assign(reservation, patch);
      }
    }) };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.locator('#navAllReservationsBtn').click();
  await expect(page.locator('.roster-person')).toContainText('【TEST】操作確認');
  await page.locator('[data-roster-check="QA-ONLY"]').click();
  await expect(page.locator('[data-roster-check="QA-ONLY"]')).toContainText('受付済');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('[data-roster-pay="QA-ONLY"]').click();
  await expect(page.locator('[data-roster-pay="QA-ONLY"]')).toContainText('入金済');
  expect(await page.evaluate(() => window.__qaUpdates)).toEqual([{ checkin: true }, { paymentStatus: 'paid' }]);
});
