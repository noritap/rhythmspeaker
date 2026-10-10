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
const widths = [360, 390, 750, 768, 810, 1024, 1280];
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
          const classFinder = classIndex ? (() => {
            const rect = el => el?.getBoundingClientRect();
            const hero = document.querySelector('.classes-hero');
            const categoryButtons = [...document.querySelectorAll('.classes-hero [data-class-category]')];
            const lineCTA = document.querySelector('.classes-hero .btn-primary');
            const trialCTA = document.querySelector('.class-beginner-route-cta');
            const route = document.querySelector('.class-beginner-route');
            const catalog = document.querySelector('.catalog-section');
            const cards = [...document.querySelectorAll('.catalog-grid article')];
            return {
              heroHeight: rect(hero)?.height,
              heroBottom: rect(hero)?.bottom,
              categoryTops: categoryButtons.map(el => rect(el).top),
              categoryHeights: categoryButtons.map(el => rect(el).height),
              lineTop: rect(lineCTA)?.top,
              lineHeight: rect(lineCTA)?.height,
              proof: document.querySelector('.classes-hero-proof')?.textContent,
              routeVisible: !!route && getComputedStyle(route).display !== 'none',
              routeBeforeCatalog: !!route && !!catalog && !!(route.compareDocumentPosition(catalog) & Node.DOCUMENT_POSITION_FOLLOWING),
              trialHref: trialCTA?.getAttribute('href'),
              trialHeight: rect(trialCTA)?.height,
              cards: cards.map(el => ({
                height: rect(el).height,
                posterWidth: rect(el.querySelector('.class-card-image')).width,
                posterHeight: rect(el.querySelector('.class-card-image')).height,
                heading: el.querySelector('h3')?.textContent,
                linkHeight: rect(el.querySelector('a'))?.height,
              })),
            };
          })() : null;
          const stepJourney = target === '/classes/step/' ? (() => {
            const sectionIds = ['levels','start','instructors','method','booking'];
            const sections = sectionIds.map(id => document.getElementById(id));
            const cards = [...document.querySelectorAll('#instructors .instructor-card')];
            const methodCards = [...document.querySelectorAll('#method .class-path article')];
            const start = document.getElementById('start');
            const booking = document.getElementById('booking');
            const trialLinks = [...document.querySelectorAll('#start a, #booking a')];
            return {
              summaryFactsVisible: [...document.querySelectorAll('.step-summary-facts > div')].filter(el =>
                getComputedStyle(el).display !== 'none').length,
              summaryFacts: [...document.querySelectorAll('.step-summary-facts > div')].map(el => ({
                label: el.querySelector('small')?.textContent.trim(),
                value: el.querySelector('strong')?.textContent.trim(),
                fontSize: parseFloat(getComputedStyle(el.querySelector('strong')).fontSize),
              })),
              faqCount: document.querySelectorAll('#faq details').length,
              faqInitiallyClosed: [...document.querySelectorAll('#faq details')].every(el => !el.open),
              faqNoInstantBooking: document.querySelector('#faq')?.textContent.includes('フォームを入力するだけでは送信・予約確定にはなりません'),
              faqAccessHref: document.querySelector('.step-faq-access')?.getAttribute('href'),
              faqTrialHref: document.querySelector('#faq details a')?.getAttribute('href'),
              faqJumpHref: document.querySelector('.class-jump a:last-child')?.getAttribute('href'),
              faqJumpFits: (() => { const el = document.querySelector('.class-jump'); return el.scrollWidth <= el.clientWidth + 1; })(),
              mobileInstructorHeadingVisible: getComputedStyle(document.querySelector('.step-instructors-title-mobile')).display !== 'none',
              desktopInstructorHeadingVisible: getComputedStyle(document.querySelector('.step-instructors-title-desktop')).display !== 'none',
              levelThirdVisible: getComputedStyle(document.querySelector('#levels .class-grid .class-card:nth-child(3)')).display !== 'none',
              levelDecision: document.querySelector('.step-level-decision .btn')?.getAttribute('href'),
              instructorFollowup: document.querySelector('.step-instructor-followup a')?.getAttribute('href'),
              methodProofVisible: getComputedStyle(document.querySelector('#method .class-proof')).display !== 'none',
              sectionsPresent: sections.every(Boolean),
              sectionsInOrder: sections.every((el,i) => i === 0 || el.compareDocumentPosition(sections[i-1]) & Node.DOCUMENT_POSITION_PRECEDING),
              processCount: start?.querySelectorAll('.step-start-steps li').length ?? 0,
              formLinks: trialLinks.filter(a => a.getAttribute('href') === '../../trial/apply/?class=STEP').length,
              lineLinks: trialLinks.filter(a => a.getAttribute('href') === 'https://lin.ee/zC5YLe7').length,
              noFalseAvailability: start?.textContent.includes('日時は送信時点では未確定') ?? false,
              instructorIntro: document.querySelector('#instructors .section-intro')?.textContent.trim(),
              instructorStyles: cards.map(el => el.querySelector('.step-instructor-style')?.textContent.trim()),
              jumpTop: parseFloat(getComputedStyle(document.querySelector('.class-jump')).top),
              navHeight: document.querySelector('nav')?.getBoundingClientRect().height,
              nextPrimary: document.querySelector('.step-next .class-actions .btn-primary')?.getAttribute('href'),
              nextSecondary: document.querySelector('.step-next .class-actions .btn-secondary')?.getAttribute('href'),
              finalHeadingKeyWidth: booking?.querySelector('.step-final-heading-key')?.getBoundingClientRect().width,
              finalHeadingWidth: booking?.querySelector('h2')?.getBoundingClientRect().width,
              instructors: cards.map(el => {
                const rect = el.getBoundingClientRect();
                const photo = getComputedStyle(el,'::before');
                return {
                  height: rect.height, width: rect.width,
                  label: el.textContent.trim(), href: el.getAttribute('href'),
                  ariaLabel: el.getAttribute('aria-label'),
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
            photos, team, hero, classFinder, stepJourney, levelPseudo: pseudo('#levels .class-card'),
            conceptPseudo: pseudo('#concept .class-card'),
            routePseudo: pseudo('.route-card'),
          };
        }, target);
        results.push({ target, width, ...data });
        expect(data.scrollWidth <= width + 1,
          width + ' ' + target + ': horizontal overflow ' + data.scrollWidth);
        if (target === '/classes/') {
          expect(data.photos.length === 6,
            width + ': class finder must show six class images');
          const finder = data.classFinder;
          expect(finder?.routeVisible && finder?.routeBeforeCatalog &&
            finder?.trialHref === '../trial/apply/?class=STEP' &&
            finder?.trialHeight >= 44,
            width + ': beginner-first STEP trial route missing, too small or below catalog');
          expect(finder?.proof?.includes('¥1,000') &&
            finder?.proof?.includes('無料レンタル'),
            width + ': hero must show confirmed trial price and free rental');
          expect(finder?.cards?.length === 6 &&
            finder.cards.every(c => c.linkHeight >= 44),
            width + ': six class cards need accessible 44px details links');
          if (width <= 390) {
            expect(finder.heroHeight <= 650,
              width + ': class finder hero is still a long mobile scroll wall (' + finder.heroHeight + 'px)');
            expect(Math.abs(finder.categoryTops[0] - finder.categoryTops[1]) < 2 &&
              finder.categoryHeights.every(h => h >= 44) &&
              finder.lineTop >= finder.categoryTops[0] + finder.categoryHeights[0] - 2 &&
              finder.lineHeight >= 44,
              width + ': category choices should be side-by-side with LINE beneath');
            expect(finder.cards.every(c => c.height <= 320 &&
              c.posterWidth >= 80 && c.posterWidth <= 105 &&
              Math.abs(c.posterWidth - c.posterHeight) < 2),
              width + ': class cards must be compact with 80-105px square un-cropped posters');
          }
        }
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
          const instructorIds = ['mifa','homma','sasasa','niu','okudaira','furusho'];
          expect(journey?.instructors.length === 6 &&
            journey.instructors.every((c,i) => c.photo &&
              c.href === '../../instructors/' + instructorIds[i] + '/' &&
              c.ariaLabel?.includes('プロフィール')),
            width + ': STEP instructor cards must link to real instructor profile pages');
          expect(journey?.instructorStyles.length === 6 &&
            journey.instructorStyles.every(Boolean) &&
            new Set(journey.instructorStyles).size === 6,
            width + ': STEP instructor cards must show six distinct approved teaching styles');
          expect(journey?.nextPrimary === '../../trial/apply/?class=STEP' &&
            journey?.nextSecondary === '../tap/',
            width + ': STEP to TAP bridge must prioritize STEP trial, not divert beginners');
          expect(journey?.jumpTop >= journey?.navHeight - 6 &&
            journey?.jumpTop <= journey?.navHeight + 12,
            width + ': sticky STEP section navigation has a visible gap or overlaps fixed header');
          expect(journey?.finalHeadingKeyWidth <= journey?.finalHeadingWidth + 1,
            width + ': final STEP booking headline has an overflowing or orphaned phrase');
          if (width === 810) {
            for (const id of instructorIds) {
              const profile = await page.request.get(base + '/instructors/' + id + '/');
              expect(profile.status() === 200,
                'STEP instructor destination /instructors/' + id + '/ returned ' + profile.status());
            }
          }
          expect(journey?.instructors.every(c => c.photoWidth >= 70 && c.photoWidth <= 100),
            width + ': STEP instructor thumbnails should be compact, not full posters');
          expect(journey?.instructors.every(c => c.height <= (width <= 390 ? 150 : 170)),
            width + ': STEP instructor cards too tall on this viewport');
          expect(journey?.faqCount === 3 && journey?.faqInitiallyClosed &&
            journey?.faqNoInstantBooking,
            width + ': FAQ must be 3 native closed disclosures and clarify booking is not instant');
          expect(journey?.faqAccessHref === '../../access/' &&
            journey?.faqTrialHref === '../../trial/' &&
            journey?.faqJumpHref === '#faq',
            width + ': FAQ must link to canonical access/trial pages and sticky menu');
          expect(journey?.summaryFacts.length === 4 &&
            journey.summaryFacts[2].value === '池袋駅から徒歩3分' &&
            journey.summaryFacts[3].value === '60分・¥1,000',
            width + ': decision summary must show verified access and trial duration/price');
          if (width <= 390) {
            expect(journey?.faqJumpFits,
              width + ': mobile four-item sticky jump menu should not scroll horizontally');
            expect(journey?.summaryFacts.every(f => f.fontSize >= 12),
              width + ': mobile class summary fact font smaller than 12px');
          }
          expect(journey?.levelDecision === '../../trial/apply/?class=STEP' &&
            journey?.instructorFollowup === '../../trial/apply/?class=STEP',
            width + ': mobile decision guidance must lead to the real STEP trial form');
          if (width <= 390) {
            expect(data.hero.height >= 620 && data.hero.height <= 650,
              width + ': mobile STEP photo hero should be 620-650px, not an oversized scroll wall');
            expect(journey?.summaryFactsVisible === 4,
              width + ': mobile STEP summary hides important class facts');
            expect(journey?.mobileInstructorHeadingVisible && !journey?.desktopInstructorHeadingVisible,
              width + ': long instructor heading still wraps an orphan kana on mobile');
            expect(!journey?.levelThirdVisible,
              width + ': duplicate TAP level card should not interrupt the beginner STEP choice');
            expect(!journey?.methodProofVisible,
              width + ': redundant method proof tags add unnecessary mobile scrolling');
          } else if (width >= 750) {
            expect(journey?.desktopInstructorHeadingVisible && journey?.levelThirdVisible,
              width + ': desktop STEP content was unintentionally hidden');
          }
          expect(journey?.methodCount === 3 && journey?.methodBackground !== 'rgb(17, 17, 17)',
            width + ': STEP learning stages must be compact, light, and scannable');
        }
        if (target === '/classes/step/' && width === 390) {
          const faqFirst = page.locator('#faq details').first();
          await faqFirst.locator('summary').click();
          expect(await faqFirst.evaluate(el => el.open),
            '390: FAQ disclosure does not open by tap');
          await faqFirst.locator('summary').focus();
          await page.keyboard.press('Space');
          expect(!(await faqFirst.evaluate(el => el.open)),
            '390: FAQ disclosure does not close with keyboard Space');
          const accessResponse = await page.request.get(base + '/access/');
          expect(accessResponse.status() === 200,
            '390: FAQ access destination returned ' + accessResponse.status());
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
        if (width === 390 || width === 750 || width === 810 || width === 1024 || width === 1280) {
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
