'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  for(const width of [320,375,390,430,768,1440]){
   const page=await browser.newPage({viewport:{width,height:820}});
   page.on('pageerror',err=>errors.push(width+': '+err.message));
   await page.goto('http://127.0.0.1:8765/music/',{waitUntil:'domcontentloaded'});
   await page.locator('[data-rsm-results] .rsm-track-row').first().waitFor({timeout:15000});
   assert.match(await page.locator('[data-rsm-count]').innerText(),/52曲/);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>2){const offenders=await page.evaluate(()=>Array.from(document.querySelectorAll('*')).map(el=>({tag:el.tagName,cls:(el.className||'').toString().slice(0,110),text:(el.textContent||'').trim().slice(0,35),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)})).filter(x=>x.right>window.innerWidth+2||x.left< -2).slice(0,25));console.log('OVERFLOW OFFENDERS',width,JSON.stringify(offenders));}
   assert(overflow<=2,'horizontal overflow '+width+': '+overflow);
   if(width===390){
    await page.locator('[data-rsm-search]').fill('Steady Hands');
    assert.match(await page.locator('[data-rsm-count]').innerText(),/1曲/);
    await page.locator('[data-rsm-results] button[data-rsm-play]').click();
    await page.locator('.rsm-player:not([hidden]) iframe').waitFor();
    assert.match(await page.locator('.rsm-player iframe').getAttribute('src'),/youtube-nocookie\.com\/embed\/5b8VhqLYnls/);
    await page.getByRole('button',{name:'プレーヤーを閉じる'}).click();
    assert.equal(await page.locator('.rsm-player').getAttribute('hidden'),'');
   }
   await page.close();
  }
  for(const [slug,count] of [['velvet-city-motion',12],['saa-ittemiyouka',12],['tap-dance-in-suspense',14],['disco-001',14]]){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   page.on('pageerror',err=>errors.push(slug+': '+err.message));
   await page.goto('http://127.0.0.1:8765/music/albums/'+slug+'/',{waitUntil:'domcontentloaded'});
   await page.locator('ol.tracklist .rsm-track-row').first().waitFor({timeout:15000});
   assert.equal(await page.locator('ol.tracklist .rsm-track-row').count(),count);
   if(slug==='disco-001'){
    await page.locator('ol.tracklist button[data-rsm-play]').first().click();
    await page.locator('.rsm-player iframe').waitFor();
    assert.match(await page.locator('.rsm-player iframe').getAttribute('src'),/embed\/xt9ocm2flb8/);
    await page.getByRole('button',{name:'プレーヤーを閉じる'}).click();
   }
   if(slug==='tap-dance-in-suspense'){
    await page.locator('ol.tracklist button[data-rsm-play]').first().click();
    await page.locator('.rsm-player iframe').waitFor();
    assert.match(await page.locator('.rsm-player iframe').getAttribute('src'),/embed\/videoseries\?list=PLAL3eUAGF9Tg/);
   }
   await page.close();
  }
  assert.deepEqual(errors,[],'browser JavaScript errors');
  console.log('MUSIC BROWSER SMOKE PASS: 6 widths, 4 album pages, search, video/playlist embed, close');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
