/* Browser QA for canonical class imagery and no-crop UX.
   Runs against the PR preview local server from ux-pr220-browser-check.yml. */
const { chromium } = require('playwright');
const fs = require('fs');

const base = 'http://127.0.0.1:8002';
const classes = ['step', 'tap', 'stretch', 'isolation', 'bar-method', 'hiit'];
const widths = [360, 390, 750, 768, 1280];
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
        // Force lazy-loaded posters to decode before measuring them.
        await page.evaluate(async (target) => {
          const selector = target === '/classes/' ? '.class-card-image' :
            target === '/classes/stretch/' ? '.stretch-identity-photo, .stretch-team-photo' :
            target === '/access/' ? null : '.class-identity-photo';
          if (!selector) return;
          const imgs = [...document.querySelectorAll(selector)];
          await Promise.all(imgs.map(async img => {
            img.loading = 'eager';
            try { await img.decode(); } catch (_) { /* reported below */ }
          }));
        }, target);
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
          const heroEl = document.querySelector('.class-hero');
          const heroRect = heroEl?.getBoundingClientRect();
          const primaryCTA = heroEl?.querySelector('.class-actions .btn-primary');
          const ctaRect = primaryCTA?.getBoundingClientRect();
          const kickerRect = heroEl?.querySelector('.class-kicker')?.getBoundingClientRect();
          const navRect = document.querySelector('nav')?.getBoundingClientRect();
          const secondary = heroEl?.querySelector('.class-actions .btn-secondary');
          const hero = heroEl ? {
            height: heroRect.height,
            color: getComputedStyle(heroEl).color,
            background: getComputedStyle(heroEl).backgroundImage,
            ctaTop: ctaRect?.top ?? null,
            ctaHeight: ctaRect?.height ?? null,
            kickerTop: kickerRect?.top ?? null,
            navBottom: navRect?.bottom ?? null,
            secondaryColor: secondary ? getComputedStyle(secondary).color : null,
            panelWidth: document.querySelector('.class-panel')?.getBoundingClientRect().width ?? null,
          } : null;
          const team = target === '/classes/stretch/' ?
            [...document.querySelectorAll('.stretch-team-photo')].map(el => el.complete && el.naturalWidth > 0) : [];
          return {
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            photos, team, hero, levelPseudo: pseudo('#levels .class-card'),
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
        if (data.hero && target !== '/classes/stretch/') {
          // This catches the actual 2026-10-09 regression: an oversized black
          // hero with a miniature poster hidden inside a huge dashboard panel.
          expect(data.hero.color === 'rgb(32, 29, 27)',
            width + ' ' + target + ': class intro is not a light editorial layout');
          expect(data.hero.height < (width <= 390 ? 740 : 690),
            width + ' ' + target + ': class hero too tall (' + data.hero.height + 'px)');
          expect(data.photos[0]?.width >= (width >= 750 ? 220 : 115),
            width + ' ' + target + ': class poster too small (' + data.photos[0]?.width + 'px)');
          expect(data.hero.kickerTop >= data.hero.navBottom + 8,
            width + ' ' + target + ': class eyebrow is hidden behind fixed navigation');
          expect(data.hero.secondaryColor === 'rgb(37, 33, 30)',
            width + ' ' + target + ': secondary CTA text is low contrast');
          expect(data.hero.ctaHeight >= 44,
            width + ' ' + target + ': primary booking CTA tap target too small');
          expect(data.hero.ctaTop < (width <= 390 ? 650 : 690),
            width + ' ' + target + ': primary CTA too far down the page');
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
        if (width === 390 || width === 750 || width === 1280) {
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
