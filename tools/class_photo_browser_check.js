/* Browser QA for canonical class imagery and no-crop UX.
   Runs against the PR preview local server from ux-pr220-browser-check.yml. */
const { chromium } = require('playwright');
const fs = require('fs');

const base = 'http://127.0.0.1:8002';
const classes = ['step', 'tap', 'stretch', 'isolation', 'bar-method', 'hiit'];
const widths = [360, 390, 768, 1280];
const errors = [];
const results = [];

function expect(ok, message) { if (!ok) errors.push(message); }

(async () => {
  fs.mkdirSync('ux-evidence', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      const targets = ['/classes/', ...classes.map(c => '/classes/' + c + '/'), '/access/'];
      for (const target of targets) {
        const response = await page.goto(base + target, { waitUntil: 'load' });
        expect(response?.status() === 200, width + ' ' + target + ': HTTP ' + response?.status());
        const data = await page.evaluate((target) => {
          const classIndex = target === '/classes/';
          const access = target === '/access/';
          const photoSelector = classIndex ? '.class-card-image' :
            target === '/classes/stretch/' ? '.stretch-identity-photo' :
            access ? null : '.class-identity-photo';
          const photos = photoSelector ? [...document.querySelectorAll(photoSelector)].map(el => {
            const rect = el.getBoundingClientRect();
            return {
              src: el.getAttribute('src'), loaded: el.complete && el.naturalWidth > 0,
              width: rect.width, height: rect.height,
              objectFit: getComputedStyle(el).objectFit,
              alt: el.getAttribute('alt') || '',
            };
          }) : [];
          const pseudo = selector => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const style = getComputedStyle(el, '::before');
            return { content: style.content, display: style.display };
          };
          const team = target === '/classes/stretch/' ?
            [...document.querySelectorAll('.stretch-team-photo')].map(el => el.complete && el.naturalWidth > 0) : [];
          return {
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            photos, team, levelPseudo: pseudo('#levels .class-card'),
            conceptPseudo: pseudo('#concept .class-card'),
            routePseudo: pseudo('.route-card'),
          };
        }, target);
        results.push({ target, width, ...data });
        expect(data.scrollWidth <= width + 1,
          width + ' ' + target + ': horizontal overflow ' + data.scrollWidth);
        if (target === '/classes/') expect(data.photos.length === 6,
          width + ': class finder must show six class images');
        else if (target !== '/access/') expect(data.photos.length === 1,
          width + ' ' + target + ': must show one class identity poster');
        for (const photo of data.photos) {
          expect(photo.loaded, width + ' ' + target + ': broken image ' + photo.src);
          expect(photo.objectFit === 'contain',
            width + ' ' + target + ': artwork cropped (' + photo.objectFit + ')');
          expect(photo.width >= 80 && Math.abs(photo.width - photo.height) < 3,
            width + ' ' + target + ': poster not square (' + photo.width + 'x' + photo.height + ')');
        }
        if (target === '/classes/step/') {
          expect(data.levelPseudo?.content === 'none' || data.levelPseudo?.display === 'none',
            width + ': STEP level cards still show repeated dancer photos');
        }
        if (target === '/classes/tap/') {
          expect(data.conceptPseudo?.content === 'none' || data.conceptPseudo?.display === 'none',
            width + ': TAP concept cards still show repeated dancer photos');
        }
        if (target === '/classes/stretch/') {
          expect(data.team.length === 2 && data.team.every(Boolean),
            width + ': STRETCH canonical instructor photos did not load');
        }
        if (target === '/access/') {
          expect(data.routePseudo?.content === 'none' || data.routePseudo?.display === 'none',
            width + ': access route still shows irrelevant dancer photo');
        }
        if (width === 390 || width === 1280) {
          const slug = target.split('/').filter(Boolean).join('-') || 'home';
          await page.screenshot({ path: 'ux-evidence/photo-' + slug + '-' + width + '.png', fullPage: false });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync('ux-evidence/class-photo-report.json', JSON.stringify({ errors, results }, null, 2));
  console.log('CLASS PHOTO BROWSER QA:', errors.length ? 'FAIL' : 'PASS',
    '(' + results.length + ' viewport/page combinations)');
  if (errors.length) { errors.forEach(e => console.error(' - ' + e)); process.exitCode = 1; }
})().catch(error => { console.error(error); process.exitCode = 1; });
