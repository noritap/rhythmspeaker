/* CI regression for the new static Sites migration. No submission, auth, calendar or DB writes. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true});const page=await browser.newPage();const base='http://127.0.0.1:8002/rhythmspeaker/';const errors=[];page.on('pageerror',e=>errors.push(e.message));const routes=['','trial/','schedule/','pricing/','classes/','instructors/','about/','access/','faq/','ecosystem/','rental/'];
// Current rental contract. Select an actual future date without sending a LINE message.
await page.setViewportSize({width:390,height:850});
await page.goto(base+'rental/');
const rentalMenu = page.locator('#menu-button');
await rentalMenu.click();
assert(await page.locator('#menu .rs-menu-action--wallet').isVisible());
await page.locator('#menu a').first().press('Escape');
assert.equal(await rentalMenu.getAttribute('aria-expanded'),'false');
const booking = page.frameLocator('#rental-booking-frame');
await booking.locator('#rental-next-month').click();
await booking.locator('#rental-calendar-days button:enabled').first().click();
await booking.locator('#rental-time').selectOption('14:00');
assert.equal(await booking.locator('#rental-summary-total').innerText(),'¥3,500');
await booking.locator('[data-booking-plan="シェアレンタル"]').click();
await booking.locator('#rental-time').selectOption('14:00');
assert.equal(await booking.locator('#rental-summary-total').innerText(),'¥500');
assert.match(await booking.locator('.rsr-booking-small').innerText(),/返信で確定/);
console.log('Rental preview: mobile menu, embedded dates and private/share estimates passed');
// Purpose-ranked shared header: visible hierarchy, keyboard return, reachability, and scroll.
for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:640});
  await page.goto(base+'ecosystem/');
  const toggle=page.locator('#menu-button'),menu=page.locator('#menu');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await toggle.getAttribute('aria-label'),'メニューを閉じる');
  assert.equal(await toggle.locator('span').innerText(),'×');
  assert(await menu.isVisible());
  assert.equal(await menu.locator('nav.rs-menu-nav').count(),1);
  assert.equal(await menu.locator('.rs-menu-group').count(),6);
  assert.equal(await menu.locator('.rs-menu-group--media').count(),1);
  assert.equal(await menu.locator('.rs-menu-group--services').count(),1);
  assert.equal(await menu.locator('.rs-menu-link--broadcast').count(),1);
  assert.equal(await menu.locator('.rs-menu-link--music').count(),1);
  assert.equal(await menu.locator('a[href="https://tapdance-rhythmspeaker.hatenablog.com/"]').count(),1);
  assert.equal(await menu.locator('a[href="https://rhythmspeaker.hatenablog.com/"]').count(),1);
  assert.equal(await menu.locator('.rs-menu-action').count(),6);
  assert.equal(await menu.locator('.rs-menu-link--ecosystem[aria-current="page"]').count(),1);
  assert.equal(await menu.locator('.rs-menu-group--blogs a').count(),2);
  assert.equal(await menu.locator('a[href$="schedule/"]').count(),1);
  assert.equal(await menu.locator('a[href$="trial/"]').count(),1);
  assert.equal(await menu.locator('a[href="https://lin.ee/zC5YLe7"]').count(),1);
  assert.equal(await menu.locator('a[href="https://rhythmspeaker.stores.jp/?all_items=true"]').count(),1);
  assert.equal(await menu.locator('a[href="https://tips-app-seven.vercel.app/"]').count(),1);
  assert.equal(await menu.locator('.rs-menu-action--goods').count(),1);
  assert.equal(await menu.locator('.rs-menu-link--rss').count(),1);
  assert.equal(await menu.locator('.rs-menu-group--quick').evaluate(el=>el.getBoundingClientRect().top)
      <await menu.locator('.rs-menu-group--lessons').evaluate(el=>el.getBoundingClientRect().top),true);
  assert(await menu.evaluate(el=>el.getBoundingClientRect().height<=window.innerHeight-50),'menu fits within viewport');
  assert(await page.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth),width+' header menu horizontal overflow');
  const topCards = menu.locator('.rs-menu-group--quick a, .rs-menu-group--services a');
  assert.equal(await topCards.count(), 6);
  const panel = await menu.boundingBox();
  for (const card of await topCards.all()) {
    const box = await card.boundingBox();
    assert(box && box.height >= 44 && box.y + box.height <= panel.y + panel.height,
      `primary card must fit above the fold at ${width}px`);
  }
  assert(await topCards.first().evaluate(el => el === document.activeElement));
  assert.equal(await menu.evaluate(el => el.scrollWidth <= el.clientWidth), true);
  assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).overflowY), 'hidden');
  for (const link of await menu.locator('a').all()) {
    assert(await link.evaluate(el => el === document.activeElement && el.offsetHeight >= 44 && el.offsetWidth >= 44));
    await page.keyboard.press('Tab');
  }
  assert(!(await menu.isVisible()), 'focus leaving the menu closes it');
  await toggle.click();
  if(width===390||width===1440){
    fs.mkdirSync('ux-evidence',{recursive:true});
    await page.screenshot({path:'ux-evidence/priority-menu-'+width+'.png'});
  }
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.equal(await toggle.getAttribute('aria-label'),'メニューを開く');
  assert.equal(await toggle.locator('span').innerText(),'＋');
  assert(await toggle.evaluate(el=>document.activeElement===el));
  assert(!(await menu.isVisible()));
  // Reopening after a deep scroll must restore P0 actions, not the previous lower position.
  await toggle.click();
  assert(await menu.isVisible());
  assert((await menu.evaluate(el=>el.scrollTop)) <= 8, 'reopened menu must start at its top');
  assert(await menu.locator('.rs-menu-action--schedule').isVisible(), 'primary schedule action remains reachable');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
}
for (const route of ['', 'schedule/', 'trial/', 'rental/', 'access/']) {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({width,height:640});
    await page.goto(base+route);
    const toggle = page.locator('#menu-button');
    const menu = page.locator('#menu');
    await toggle.click();
    assert.equal(await menu.locator('.rs-menu-action').count(),6);
    assert.equal(await menu.locator('.rs-menu-group--blogs a').count(),2);
    assert(await menu.evaluate(el=>el.scrollWidth<=el.clientWidth && el.getBoundingClientRect().bottom<=innerHeight));
    await page.keyboard.press('Escape');
    assert(await toggle.evaluate(el=>el===document.activeElement));
  }
}
console.log('Shared menu: seven widths on the service directory, five representative routes, keyboard and touch targets passed');
// Compact ecosystem: four priority actions, two blogs and five native accordions.
for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'ecosystem/');
  const quick=page.locator('.rs-eco-quick-grid a');
  assert.equal(await quick.count(),4,'four priority services');
  assert.equal(await page.locator('.rs-eco-blog-grid a').count(),2,'two separate blogs');
  assert.equal(await page.locator('.rs-eco-group').count(),5,'five accordion groups');
  for(const [i,destination] of ['trial/','schedule/','rental/','shoten/'].entries()){
    assert.equal(new URL(await quick.nth(i).getAttribute('href'),base+'ecosystem/').pathname,new URL(destination,base).pathname);
  }
  assert.equal(await page.locator('.rs-eco-blog-grid a').first().getAttribute('href'),'https://tapdance-rhythmspeaker.hatenablog.com/');
  assert.equal(await page.locator('.rs-eco-blog-grid a').last().getAttribute('href'),'https://rhythmspeaker.hatenablog.com/');
  assert(await page.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth),width+' ecosystem overflow');
  assert.equal(await page.locator('.rs-eco-quick-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length),2);
  const groups=page.locator('.rs-eco-group');
  for(let i=0;i<5;i++){
    const group=groups.nth(i);
    assert(!(await group.evaluate(el=>el.open)),'accordion starts closed');
    await group.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert(await group.evaluate(el=>el.open),'keyboard opens accordion');
    assert(await group.locator('a').first().isVisible());
    assert(await group.locator('summary').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'focus style visible');
    await group.locator('summary').press('Enter');
    assert(!(await group.evaluate(el=>el.open)),'keyboard closes accordion');
  }
  const group=groups.nth(0);
  await group.locator('summary').click();
  assert.equal(await group.locator('a[href="../classes/"]').count(),1);
  await group.locator('summary').click();
  if(width===390||width===1440){fs.mkdirSync('ux-evidence',{recursive:true});await page.screenshot({path:'ux-evidence/ecosystem-'+width+'.png',fullPage:true});}
}
for(const [selector,destination] of [
  ['.rs-eco-quick-grid a[href="../trial/"]','trial/'],
  ['.rs-eco-quick-grid a[href="../schedule/"]','schedule/'],
  ['.rs-eco-quick-grid a[href="../rental/"]','rental/'],
  ['.rs-eco-quick-grid a[href="../shoten/"]','shoten/'],
]){
  await page.goto(base+'ecosystem/');
  await page.locator(selector).click();
  await page.waitForURL(url=>url.pathname===new URL(destination,base).pathname);
}
assert.deepEqual(errors,[],'compact ecosystem preview errors');
console.log('Compact ecosystem: seven widths, four routes and five keyboard-operated accordions passed');
for(const width of [320,375,390,430,768,1440]){await page.setViewportSize({width,height:900});for(const route of routes){const r=await page.goto(base+route);assert(r.ok(),route);await page.locator('main h1').waitFor();if(route==='schedule/')await page.locator('#cf-calendar').waitFor();assert(await page.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth),`${width} ${route} overflow`);assert.deepEqual(await page.locator('img[src]').evaluateAll(es=>es.filter(e=>e.getAttribute('src')?.trim()&&e.complete&&e.naturalWidth===0).map(e=>e.currentSrc||e.getAttribute('src'))),[],`${route} image failure`);}}
// Sequential SPA navigation must freeze static header/footer URLs before the pathname changes.
await page.goto(base);await page.locator('#menu-button').click();await page.locator('#menu a[href$="schedule/"]').click();await page.locator('#cf-calendar').waitFor();await page.locator('#menu-button').click();await page.locator('#menu a[href$="pricing/"]').click();await page.waitForURL(base+'pricing/');await page.locator('summary').first().waitFor();await page.locator('footer a[href$="faq/"]').click();await page.waitForURL(base+'faq/');await page.locator('.brand-mark').click();await page.waitForURL(base+'ecosystem/');await page.locator('.brand-name').click();await page.waitForURL(base);
await page.goto(base+'schedule/');await page.locator('#cf-calendar').waitFor();
// Production may have real published classes; the old "always empty" check was obsolete.
const visibleCards=await page.locator('[data-cf-detail]').count();
const scheduleText=await page.locator('#cf-cards').innerText();
assert(visibleCards>0||/開催予定を取得していません|開催情報の同期が遅れています|開催予定を更新できませんでした|開催情報を確認できませんでした|この日のクラスは見つかりませんでした/.test(scheduleText),'Expected real classes or an explicit unavailable-data state');
assert.equal(await page.locator('#cf-scenario').count(),0);
assert.equal(await page.locator('.lab').count(),0);
assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'index,follow');
await page.locator('#cf-next').click();await page.locator('#cf-prev').click();
let selectable=page.locator('#cf-calendar button:not([disabled])');if(await selectable.count()===1){await page.locator('#cf-next').click();selectable=page.locator('#cf-calendar button:not([disabled])');}await selectable.last().click();assert(await page.locator('#cf-clear-date').isEnabled());await page.locator('#cf-clear-date').click();
assert(await page.locator('#cf-calendar').isVisible(),'calendar-first discovery must remain visible');
await page.locator('.cf-advanced summary').click();await page.locator('#cf-search').fill('本間');await page.locator('#cf-class').selectOption('STEP');await page.locator('#cf-reset').click();
await page.locator('[data-cf-mode="request"]').click();await page.locator('#cf-request-date').fill('2099-11-20');await page.locator('#cf-request-start').fill('14:00');await page.locator('#cf-request-type').selectOption('HIIT');assert.equal(await page.locator('#cf-request-duration').inputValue(),'30');await page.locator('#cf-request-teacher').selectOption('homma');await page.locator('button[type="submit"]').click();assert.equal(await page.locator('.cf-contact-actions a').first().getAttribute('href'),'https://lin.ee/zC5YLe7');assert.match(await page.locator('#cf-message').inputValue(),/本間茂樹/);assert(!/サンプル|実予約ではありません/.test(await page.locator('#cf-message').inputValue()));await page.locator('#cf-message').fill('操作テスト・送信しません');assert(decodeURIComponent(await page.locator('#cf-mail').getAttribute('href')).includes('操作テスト'));await page.locator('#cf-request-start').fill('23:45');await page.locator('button[type="submit"]').click();assert.match(await page.locator('#cf-form-error').innerText(),/日をまたぐ/);
// Isolated network fixture verifies ready-data discovery; never saved as production data.
const fixture=JSON.parse(fs.readFileSync('data/class-sessions.sample.json','utf8'));fixture.sourceMode='live';fixture.dataState='ready';fixture.lastSuccessfulSyncAt=new Date().toISOString();const fixtureDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));// Keep the two sessions this scenario exercises, independent of today's date.
fixture.sessions = fixture.sessions
  .filter(session => ['demo-01', 'demo-02'].includes(session.id))
  .map(session => ({...session, source:'live', date:fixtureDate}));
await page.route('**/data/class-sessions.public.json',route=>route.fulfill({json:fixture}));await page.goto(base+'schedule/');await page.locator('#cf-calendar').waitFor();await page.locator('#cf-nearest').click();await page.locator('[data-cf-date="'+fixtureDate+'"]').click();assert.match(await page.locator('#cf-count').innerText(),/2件/);await page.locator('[data-cf-detail="demo-02"]').click();await page.locator('#cf-join-apply').click();assert.match(await page.locator('#cf-message').inputValue(),/本間茂樹/);assert.equal(await page.locator('.cf-contact-actions a').first().getAttribute('href'),'https://lin.ee/zC5YLe7');await page.locator('.dialog-close').click();await page.unroute('**/data/class-sessions.public.json');
await page.goto(base+'classes/');await page.locator('[data-group="body"]').click();assert.equal(await page.locator('[data-class]:visible').count(),4);await page.goto(base+'instructors/');await page.locator('#name-search').fill('本間');assert.equal(await page.locator('[data-person]:visible').count(),1);await page.goto(base+'faq/');await page.locator('summary').first().click();assert(await page.locator('details[open]').count()>0);await page.goto(base+'trial/apply/');assert(await page.locator('#line').count()===1);
assert.deepEqual(errors,[]);fs.mkdirSync('ux-evidence',{recursive:true});await page.goto(base+'schedule/');await page.locator('#cf-calendar').waitFor();await page.screenshot({path:'ux-evidence/sites-migration-schedule.png',fullPage:true});await browser.close();console.log('PASS: 10 routes x6 widths, discovery/form/contact safety, preserved trial handoff. No actual send performed.');})().catch(e=>{console.error(e);process.exit(1)});
