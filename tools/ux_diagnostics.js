const { chromium } = require('playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');

const widths = [375, 390, 768, 1440];
const routes = ['/', '/trial/', '/trial/apply/', '/classes/', '/instructors/', '/faq/', '/access/', '/broadcast/'];
const phases = { before: 'http://127.0.0.1:8001', after: 'http://127.0.0.1:8002' };

(async () => {
  fs.mkdirSync('ux-evidence', { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  const forms = [];
  for (const [phase, origin] of Object.entries(phases)) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 850 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
      const page = await context.newPage();
      for (const route of routes) {
        const errors = [];
        const capture = error => errors.push(error.message);
        page.on('pageerror', capture);
        const response = await page.goto(origin + route, { waitUntil: 'load' });
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const axe = await page.evaluate(async () => {
          const a = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return a.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
        });
        const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
        results.push({ phase, route, width, status: response?.status(), ...layout, pageErrors: [...errors], axe });
        page.off('pageerror', capture);
        if (route === '/trial/apply/') {
          await page.screenshot({ path: `ux-evidence/${phase}-application-${width}.png`, fullPage: true });
          await page.getByLabel('お名前', { exact: true }).fill('　   ');
          await page.locator('#copy').click();
          const whitespace = await page.evaluate(() => ({ feedback: document.querySelector('#feedback').textContent, focus: document.activeElement.id }));
          await page.getByLabel('お名前', { exact: true }).fill('検証用ユーザー');
          await page.locator('#date').fill('2000-01-01');
          await page.locator('#copy').click();
          const pastDate = await page.evaluate(() => ({ feedback: document.querySelector('#feedback').textContent, focus: document.activeElement.id }));
          forms.push({ phase, width, whitespace, pastDate });
        }
      }
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync('ux-evidence/diagnostics.json', JSON.stringify({ results, forms }, null, 2));
  for (const [phase, origin] of Object.entries(phases)) {
    for (const [name, route] of [['home', '/'], ['trial', '/trial/'], ['apply', '/trial/apply/']]) {
      execFileSync(process.execPath, [require.resolve('lighthouse/cli/index.js'), origin + route,
        '--chrome-path=' + chromium.executablePath(), '--chrome-flags=--headless --no-sandbox',
        '--output=json', '--output=html', '--output-path=ux-evidence/' + phase + '-' + name + '-lighthouse',
        '--quiet'], { stdio: 'inherit', timeout: 180000 });
    }
  }
  console.log(JSON.stringify({ forms, violations: results.filter(r => r.axe.length).map(r => ({ phase:r.phase,route:r.route,width:r.width,rules:r.axe.map(v=>v.id) })) }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
