const { chromium } = require('playwright');
const fs = require('fs');

const pages = [
  ['home', '/'], ['trial', '/trial/'], ['apply', '/trial/apply/'],
  ['classes', '/classes/'], ['instructors', '/instructors/'],
  ['faq', '/faq/'], ['access', '/access/'], ['broadcast', '/broadcast/'],
];
const widths = [375, 390, 768, 1440];
const origins = {
  before: 'http://127.0.0.1:8001',
  after: 'http://127.0.0.1:8002',
};

(async () => {
  fs.mkdirSync('ux-evidence', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = [];
  let failures = 0;
  for (const [phase, origin] of Object.entries(origins)) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 850 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      for (const [name, path] of pages) {
        const response = await page.goto(origin + path, { waitUntil: 'load' });
        await page.screenshot({ path: `ux-evidence/${phase}-${name}-${width}.png`, fullPage: name === 'apply' });
        const result = await page.evaluate(() => ({
          title: document.title,
          h1: document.querySelector('h1')?.textContent.trim() || '',
          viewportWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          applyButtons: [...document.querySelectorAll('#apply button')].map(b => ({
            text: b.textContent.trim(), width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height,
          })),
        }));
        report.push({ phase, page: name, width, status: response?.status(), ...result });
        if (response?.status() !== 200 || result.scrollWidth > result.viewportWidth) failures++;
        if (name === 'apply' && phase === 'after') {
          if (!await page.getByText('体験レッスン 60分').isVisible()) failures++;
          if (!await page.getByText('来店目安 15分前').isVisible()) failures++;
          if (result.applyButtons.some(b => b.height < 44)) failures++;
          await page.getByRole('button', { name: 'LINEで申込文章を開く →' }).click();
          if (!await page.getByText('お名前を入力してください。').isVisible()) failures++;
          if (!page.url().startsWith(origin)) failures++;
          await page.goto(origin + '/trial/apply/?class=STEP');
          if (!await page.locator('input[name="classes"][value="STEP"]').isChecked()) failures++;
          if (!(await page.locator('#preview').innerText()).includes('興味のあるクラス：STEP')) failures++;
        }
      }
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync('ux-evidence/report.json', JSON.stringify({ failures, results: report }, null, 2));
  console.log(JSON.stringify({ failures, results: report.filter(x => x.page === 'apply') }, null, 2));
  if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
