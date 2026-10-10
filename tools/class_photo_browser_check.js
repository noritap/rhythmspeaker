/* Browser QA for canonical class imagery and no-crop UX.
   Runs against the PR preview local server from ux-pr220-browser-check.yml. */
const { chromium } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');

// This is the SHA-256 of the user-approved, 1600×900 WebP lesson photograph.
// Prevent an unrelated or re-encoded photo from silently replacing the approved hero.
const STEP_HERO_SHA256 = '4e88432ff5c6194192629d42debdc6cc5c9757d61911d57ad64cf1dfbb9ef89f';

const base = 'http://127.0.0.1:8002';
const classes = ['step', 'tap', 'stretch', 'isolation', 'bar-method', 'hiit'];
const widths = [360, 390, 750, 768, 1280];
const errors = [];
const results = [];

function expect(ok, message) { if (!ok) errors.push(message); }

(async () => {
  const heroAssetPath = 'assets/classes/class-step-hero-lesson-v1.webp';
  if (fs.existsSync(heroAssetPath)) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(heroAssetPath)).digest('hex');
    expect(digest === STEP_HERO_SHA256,
      'STEP hero does not match the exact user-approved image (SHA-256 mismatch)');
  } else {
    expect(false, 'STEP hero image is missing from the repository: ' + heroAssetPath);
  }
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
          const lessonPhoto = heroEl?.querySelector('.step-hero-photo');
          const heroRect = heroEl?.getBoundingClientRect();
          const copyRect = heroEl?.querySelector('.step-hero-copy')?.getBoundingClientRect();
          const heading = heroEl?.querySelector('h1');
          const headingLineHeight = heading ? parseFloat(getComputedStyle(heading).lineHeight) : 0;
          const primaryCTA = heroEl?.querySelector('.class-actions .btn-primary');
          const ctaRect = primaryCTA?.getBoundingClientRect();
          const kickerRect = heroEl?.querySelector('.class-kicker')?.getBoundingClientRect();
          const navRect = document.querySelector('nav')?.getBoundingClientRect();
          const secondary = heroEl?.querySelector('.class-actions .btn-secondary');
          const hero = heroEl ? {
            height: heroRect.height,
            bottom: heroRect.bottom,
            copyBottom: copyRect?.bottom ?? null,
            headingText: heading?.textContent?.trim() ?? null,
            headingLines: headingLineHeight ? heading.getBoundingClientRect().height / headingLineHeight : null,
            color: getComputedStyle(heroEl).color,
            background: getComputedStyle(heroEl).backgroundImage,
            lessonPhoto: lessonPhoto ? {
              loaded: lessonPhoto.complete && lessonPhoto.naturalWidth > 0,
              naturalWidth: lessonPhoto.naturalWidth,
              naturalHeight: lessonPhoto.naturalHeight,
              src: lessonPhoto.getAttribute('src'),
              fit: getComputedStyle(lessonPhoto).objectFit,
              width: lessonPhoto.getBoundingClientRect().width,
              height: lessonPhoto.getBoundingClientRect().height,
              alt: lessonPhoto.alt,
            } : null,
            ctaTop: ctaRect?.top ?? null,
            ctaBottom: ctaRect?.bottom ?? null,
            ctaHeight: ctaRect?.height ?? null,
            kickerTop: kickerRect?.top ?? null,
            navBottom: navRect?.bottom ?? null,
            secondaryColor: secondary ? getComputedStyle(secondary).color : null,
            panelWidth: document.querySelector('.class-panel')?.getBoundingClientRect().width ?? null,
          } : null;
          const stepJourney = target === '/classes/step/' ? (() => {
            const sectionIds = ['levels','start','instructors','method','booking'];
            const sections = sectionIds.map(id => document.getElementById(id));
            const cards = [...document.querySelectorAll('#instructors .instructor-card')];
            const methodCards = [...document.querySelectorAll('#method .class-path article')];
            const start = document.getElementById('start');
            const booking = document.getElementById('booking');
            const trialLinks = [...document.querySelectorAll('#start a, #booking a')];
            return {
              sectionsPresent: sections.every(Boolean),
              sectionsInOrder: sections.every((el,i) => i === 0 || el.compareDocumentPosition(sections[i-1]) & Node.DOCUMENT_POSITION_PRECEDING),
              processCount: start?.querySelectorAll('.step-start-steps li').length ?? 0,
              formLinks: trialLinks.filter(a => a.getAttribute('href') === '../../trial/apply/?class=STEP').length,
              lineLinks: trialLinks.filter(a => a.getAttribute('href') === 'https://lin.ee/zC5YLe7').length,
              noFalseAvailability: start?.textContent.includes('日時は送信時点では未確定') ?? false,
              instructors: cards.map(el => {
                const rect = el.getBoundingClientRect();
                const photo = getComputedStyle(el,'::before');
                return {
                  height: rect.height, width: rect.width,
                  label: el.textContent.trim(), href: el.getAttribute('href'),
                  photo: photo.backgroundImage !== 'none',
                  photoWidth: parseFloat(photo.width),
                };
              }),
              methodCount: methodCards.length,
              methodBackground: methodCards.length ? getComputedStyle(methodCards[0]).backgroundColor : null,
              lastBookingHasLine: !!booking?.querySelector('a[href="https://lin.ee/zC5YLe7"]'),
            };
          })() : null;
          const team = target === '/classes/stretch/' ?
            [...document.querySelectorAll('.stretch-team-photo')].map(el => el.complete && el.naturalWidth > 0) : [];
          return {
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            photos, team, hero, stepJourney, levelPseudo: pseudo('#levels .class-card'),
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
          if (target === '/classes/step/') {
            expect(data.hero.color === 'rgb(255, 255, 255)',
              width + ': STEP hero must use white text over the actual lesson photo');
            expect(data.hero.lessonPhoto?.src.includes('class-step-hero-lesson-v1.webp'),
              width + ': STEP hero does not use approved user photo');
            expect(data.hero.lessonPhoto?.loaded,
              width + ': STEP lesson hero photo did not load');
            expect(data.hero.lessonPhoto?.naturalWidth >= 1200 && data.hero.lessonPhoto?.naturalHeight >= 650,
              width + ': STEP photo is undersized or unexpectedly cropped');
            expect(data.hero.headingText === '一音から、踊りが始まる。',
              width + ': STEP hero headline drifted from approved concise copy');
            expect(data.hero.copyBottom <= data.hero.bottom - 12,
              width + ': STEP hero text overflows the photo section');
            expect(data.hero.ctaBottom <= data.hero.bottom - 12,
              width + ': STEP booking CTA is clipped by the photo section');
            expect(data.hero.lessonPhoto?.fit === 'cover',
              width + ': STEP hero photo is not full-bleed');
            expect(data.hero.lessonPhoto?.width >= width - 1,
              width + ': STEP hero photo does not span viewport width');
            expect(data.hero.lessonPhoto?.alt?.includes('実際のSTEPレッスン'),
              width + ': STEP lesson photo lacks descriptive alternative text');
            expect(data.hero.height >= (width <= 390 ? 620 : 530),
              width + ': STEP photo hero is too short to communicate studio atmosphere');
          } else {
            expect(data.hero.color === 'rgb(32, 29, 27)',
              width + ' ' + target + ': class intro is not a light editorial layout');
          }
          expect(data.hero.height < (width <= 390 ? 740 : 760),
            width + ' ' + target + ': class hero too tall (' + data.hero.height + 'px)');
          expect(data.photos[0]?.width >= (target === '/classes/step/' ? 80 : (width >= 750 ? 220 : 115)),
            width + ' ' + target + ': class poster too small (' + data.photos[0]?.width + 'px)');
          expect(data.hero.kickerTop >= data.hero.navBottom + 8,
            width + ' ' + target + ': class eyebrow is hidden behind fixed navigation');
          expect(data.hero.secondaryColor === (target === '/classes/step/' ? 'rgb(255, 255, 255)' : 'rgb(37, 33, 30)'),
            width + ' ' + target + ': secondary CTA text is low contrast');
          expect(data.hero.ctaHeight >= 44,
            width + ' ' + target + ': primary booking CTA tap target too small');
          expect(data.hero.ctaTop < (width <= 390 ? 650 : 690),
            width + ' ' + target + ': primary CTA too far down the page');
        }
        if (target === '/classes/step/') {
          const heroPhoto = await page.request.get(base + '/assets/classes/class-step-hero-lesson-v1.webp');
          expect(heroPhoto.status() === 200,
            width + ': STEP hero image asset missing or HTTP ' + heroPhoto.status());
          expect((heroPhoto.headers()['content-type'] || '').includes('image/'),
            width + ': STEP hero asset must be a real image');
          if (heroPhoto.ok()) {
            const bytes = (await heroPhoto.body()).length;
            expect(bytes >= 10000 && bytes <= 300000,
              width + ': STEP photo should be optimized without losing visual quality (' + bytes + ' bytes)');
          }
        }
        if (target === '/classes/step/') {
          const journey = data.stepJourney;
          expect(journey?.sectionsPresent && journey?.sectionsInOrder,
            width + ': STEP conversion sections missing or in the wrong reading order');
          expect(journey?.processCount === 3 && journey?.noFalseAvailability,
            width + ': STEP booking journey must explain all three steps and no instant confirmation');
          expect(journey?.formLinks === 2 && journey?.lineLinks === 2 && journey?.lastBookingHasLine,
            width + ': STEP booking and independent LINE consultation CTAs missing');
          expect(journey?.instructors.length === 6 && journey?.instructors.every(c => c.photo && c.href?.startsWith('../../instructors/#')),
            width + ': STEP instructor cards missing approved portraits or profile links');
          expect(journey?.instructors.every(c => c.photoWidth >= 70 && c.photoWidth <= 100),
            width + ': STEP instructor thumbnails should be compact, not full posters');
          expect(journey?.instructors.every(c => c.height <= (width <= 390 ? 150 : 170)),
            width + ': STEP instructor cards too tall on this viewport');
          expect(journey?.methodCount === 3 && journey?.methodBackground !== 'rgb(17, 17, 17)',
            width + ': STEP learning stages must be compact, light, and scannable');
        }
        if (target === '/classes/step/' && width >= 750) {
          expect(data.hero?.headingLines <= 2.2,
            width + ': STEP headline has an orphaned third line');
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
