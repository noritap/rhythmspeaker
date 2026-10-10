const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch();
 for (const width of [375,390,768,1440]) {
  const page = await browser.newPage({viewport:{width,height:850}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8002/classes/');
  const tap=page.getByRole('button',{name:'タップダンス',exact:true});
  const body=page.getByRole('button',{name:'身体づくり',exact:true});
  await tap.focus(); await page.keyboard.press('Space');
  assert.equal(await tap.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.class-quickfind-grid a:visible').count(),2);
  assert.equal(await page.locator('.class-beginner-route:visible').count(),1,'STEP recommendation visible for tap filter');
  await body.focus(); await page.keyboard.press('Enter');
  assert.equal(await body.getAttribute('aria-pressed'),'true');
  assert.equal(await tap.getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('.class-quickfind-grid a:visible').count(),4);
  assert.equal(await page.locator('.class-beginner-route:visible').count(),0,'STEP recommendation hidden for body-only filter');
  await page.getByRole('button',{name:'すべて表示',exact:true}).click();
  assert.equal(await page.locator('.class-quickfind-grid a:visible').count(),6);
  assert.equal(await page.locator('.class-beginner-route:visible').count(),1,'STEP recommendation restored for all classes');
  assert.equal(await body.getAttribute('aria-pressed'),'false');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`ux-evidence/class-filter-${width}.png`});
  console.log(`PASS ${width}px: Space, Enter, 2/4/6 cards, pressed state, overflow, page errors`);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
