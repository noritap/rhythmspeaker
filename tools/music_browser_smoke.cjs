 'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[];
try{for(const width of [320,375,390,430,1280,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8765/rhythmspeaker/music/';
 for(const route of ['#home','#discover','#albums','#album/disco-001','#album/tap-dance-in-suspense','#album/saa-ittemiyouka','#album/velvet-city-motion','#listen/velvet-city-motion-02']){
 await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForFunction(r=>{const h=document.querySelector('main h1')?.textContent||'';const titles={'#home':'RHYTHM','#discover':'Find your groove.','#albums':'Record collection.','#album/disco-001':'DISCO 001','#album/tap-dance-in-suspense':'TAP DANCE IN SUSPENSE','#album/saa-ittemiyouka':'さあ、行ってみようか','#album/velvet-city-motion':'VELVET CITY MOTION','#listen/velvet-city-motion-02':'Take a seat.'};return h.includes(titles[r]);},route);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),width+route+' overflow');
 assert.equal(await page.locator('main img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth===0).length),0);
 }
 await page.goto(base+'#discover');await page.getByRole('searchbox').fill('Steady Hands');await page.waitForFunction(()=>document.querySelector('#count').textContent==='1 / 52 曲');
 await page.locator('[data-play-track]').click();await page.locator('#listen-player-slot iframe').waitFor();
 assert.equal(await page.locator('#yt').getAttribute('href'),'https://youtu.be/5b8VhqLYnls');
 await page.locator('#next').click();assert.equal(await page.locator('#now-record h2').innerText(),'Saturday Shoes');
 await page.locator('#prev').click();assert.equal(await page.locator('#now-record h2').innerText(),'Steady Hands');
 await page.locator('[data-queue-track="velvet-city-motion-01"]').click();assert(await page.locator('#prev').isDisabled());
 await page.getByRole('link',{name:'HOME',exact:true}).click();await page.waitForFunction(()=>document.querySelector('main h1')?.textContent.includes('RHYTHM')&&document.querySelectorAll('#video iframe').length===0);assert.equal(await page.locator('#video iframe').count(),0,'player must stop outside LISTEN');
 for(const slug of ['disco-001','tap-dance-in-suspense','saa-ittemiyouka','velvet-city-motion']){
 await page.goto(base+'albums/'+slug+'/');await page.locator('main .album-stage h1').waitFor();
 assert.equal(await page.locator('.album-tracks .track-row').count(),slug==='disco-001'||slug==='tap-dance-in-suspense'?14:12);
 assert.equal(await page.locator('.related .record-card').count(),3);
 }
 await page.close();}
 assert.deepEqual(errors,[]);console.log('PASS: 7 widths x 8 screens, 4 direct album URLs, search, queue, next/previous, stop on exit, images');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
