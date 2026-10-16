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
