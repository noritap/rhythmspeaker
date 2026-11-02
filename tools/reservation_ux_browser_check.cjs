'use strict';
// Isolated browser fixtures only. No Calendar/DB writes or real message sending.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.RESERVATION_BASE_URL||'http://127.0.0.1:8020/';
const evidence='ux-evidence/reservation-v3';fs.mkdirSync(evidence,{recursive:true});
const source=JSON.parse(fs.readFileSync('data/class-sessions.public.json','utf8'));
function fixture(){const v=structuredClone(source);v.lastSuccessfulSyncAt='2026-11-02T08:18:40+09:00';v.dataState='ready';v.sessions=v.sessions.slice(0,2).map((s,i)=>({...s,id:'session-ux-fixture-'+i,date:'2026-11-03',start:i?'14:00':'12:30',end:i?'15:00':'13:30',publicStatus:'OPEN',bookingCountStatus:'unknown',confirmedBookingCount:null,bookingCountSource:null}));return v;}
(async()=>{
 const browser=await chromium.launch({headless:true});const report={widths:[],scenarios:[],errors:[]};
 try{
  for(const width of [320,375,390,430,768,1440]){
   const context=await browser.newContext({viewport:{width,height:740},permissions:['clipboard-read','clipboard-write']});
   const page=await context.newPage();let payload=fixture(),fail=false,requests=0,hold=false,release;
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.clock.install({time:new Date('2026-11-02T08:35:00+09:00')});
   await page.route('**/data/class-sessions.public.json*',async r=>{requests++;if(hold)await new Promise(resolve=>release=resolve);if(fail)return r.abort();await r.fulfill({json:payload});});
   await page.route('https://lin.ee/**',r=>r.abort());
   await page.goto(base+'schedule/');await page.locator('[data-cf-detail]').first().waitFor();
   assert(await page.locator('#cf-refresh').isHidden(),'normal retry must be hidden');
   await page.locator('[data-cf-detail]').first().click();await page.locator('#cf-join-apply').waitFor();
   assert.equal(await page.locator('#detail a[href$="classes/"]').count(),0,'no forced class-page departure');
   await page.getByText('このクラスについて詳しく',{exact:true}).click();
   assert(await page.locator('#detail').innerText().then(t=>t.includes('料金・参加方法')));
   await page.screenshot({path:`${evidence}/detail-${width}.png`});
   await page.locator('#cf-join-apply').click();
   const generated=await page.locator('#cf-message').inputValue();assert(generated.includes('session-ux-fixture-0'));
   const edited=generated+'\n参加経験について相談したいです。';await page.locator('#cf-message').fill(edited);
   await page.locator('#cf-back-detail').click();await page.locator('#cf-join-apply').click();assert.equal(await page.locator('#cf-message').inputValue(),edited);
   await page.goBack();await page.locator('#cf-join-apply').waitFor();await page.goForward();await page.locator('#cf-message').waitFor();assert.equal(await page.locator('#cf-message').inputValue(),edited);
   assert(!page.url().includes('相談'),'draft must not enter URL');
   await page.locator('#cf-copy').click();await page.getByText('コピーしました。次は公式LINEに貼り付けて送信してください。',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),edited);
   assert((await page.locator('#cf-line').getAttribute('class')).includes('primary'));
   const mail=new URL(await page.locator('#cf-mail').getAttribute('href'));assert.equal(mail.searchParams.get('body'),edited);
   await page.screenshot({path:`${evidence}/compose-${width}.png`});
   // Layout/focus: modal fits even at 320px; all controls remain scroll reachable.
   assert(await page.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth),width+' page overflow');
   assert(await page.locator('#detail').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1;}),width+' modal bounds');
   await page.locator('#cf-line').scrollIntoViewIfNeeded();assert(await page.locator('#cf-line').isVisible());
   await page.keyboard.press('Escape');assert(!(await page.locator('#detail').isVisible()));
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.cfDetail),'session-ux-fixture-0');
   await page.locator('[data-cf-detail]').first().click();await page.locator('#cf-join-apply').click();assert.equal(await page.locator('#cf-message').inputValue(),edited);
   await page.locator('#cf-change-class').click();await page.locator('[data-cf-detail]').nth(1).click();await page.locator('#cf-join-apply').click();
   const other=await page.locator('#cf-message').inputValue();assert(other.includes('session-ux-fixture-1'));assert(!other.includes('session-ux-fixture-0'));assert(!other.includes('参加経験について相談'));
   if(width===390){
    // Denied clipboard never reports success; normal LINE remains available.
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}}));
    await page.locator('#cf-copy').click();assert((await page.locator('#cf-copy-status').innerText()).includes('手動でコピー'));
    assert(await page.locator('#cf-line').isVisible());
    // Revalidation preserves dirty drafts and blocks a changed status.
    const keep=other+'\n保持テスト';await page.locator('#cf-message').fill(keep);
    payload.sessions[1].publicStatus='CLOSE';
    await page.evaluate(()=>cfRefreshPublished(true));await page.locator('[data-flow="UNAVAILABLE"]').waitFor();
    assert.equal(await page.locator('#cf-message').inputValue(),keep);assert.equal(await page.locator('#cf-copy').count(),0);
    assert((await page.locator('#detail').innerText()).includes('追加申し込みは受け付けていません'));
    // Reopen -> same draft when the status is restored; dates unchanged.
    payload.sessions[1].publicStatus='OPEN';await page.locator('#cf-retry-selection').click();await page.locator('#cf-copy').waitFor();assert.equal(await page.locator('#cf-message').inputValue(),keep);
    // Successful same-data refresh must not replace the textarea / cursor.
    await page.locator('#cf-message').focus();await page.evaluate(()=>{document.querySelector('#cf-message').setSelectionRange(4,4)});await page.evaluate(()=>cfRefreshPublished(true));assert.equal(await page.locator('#cf-message').inputValue(),keep);assert.equal(await page.locator('#cf-message').evaluate(e=>e.selectionStart),4);
    // Calendar metadata changes require explicit regeneration, never silently rewrite.
    payload.sessions[1].start='16:00';payload.sessions[1].end='17:00';await page.evaluate(()=>cfRefreshPublished(true));await page.locator('[data-flow="UNAVAILABLE"]').waitFor();assert.equal(await page.locator('#cf-message').inputValue(),keep);
    page.once('dialog',d=>d.accept());await page.locator('#cf-review-updated').click();await page.locator('#cf-join-apply').click();assert((await page.locator('#cf-message').inputValue()).includes('16:00'));assert(!(await page.locator('#cf-message').inputValue()).includes('保持テスト'));
    for(const state of ['CANCELLED','INQUIRY_ONLY']){payload.sessions[1].publicStatus=state;await page.evaluate(()=>cfRefreshPublished(true));assert(await page.locator('[data-flow="UNAVAILABLE"]').isVisible());payload.sessions[1].publicStatus='OPEN';await page.locator('#cf-retry-selection').click();await page.locator('#cf-copy').waitFor();}
    payload.sessions[1].bookingCountStatus='known';payload.sessions[1].bookingCountSource='fixture';payload.sessions[1].confirmedBookingCount=payload.sessions[1].capacity;await page.evaluate(()=>cfRefreshPublished(true));assert(await page.locator('[data-flow="UNAVAILABLE"]').isVisible());payload=fixture();await page.locator('#cf-retry-selection').click();
    // Fresh direct URL, missing class, stale data, network failure: all safe and retryable.
    await page.goto(base+'schedule/?class=session-ux-fixture-0&step=apply');await page.locator('#cf-message').waitFor();assert.equal(await page.locator('#cf-back-detail').count(),1);
    payload.sessions=[];await page.evaluate(()=>cfRefreshPublished(true));assert(await page.locator('[data-flow="UNAVAILABLE"]').isVisible());
    payload=fixture();payload.lastSuccessfulSyncAt='2026-11-02T00:00:00+09:00';await page.locator('#cf-retry-selection').click();assert(await page.locator('[data-flow="UNAVAILABLE"]').isVisible());
    payload=fixture();await page.locator('#cf-retry-selection').click();await page.locator('#cf-message').waitFor();fail=true;await page.evaluate(()=>cfRefreshPublished(true));assert(await page.locator('[data-flow="UNAVAILABLE"]').isVisible());assert(await page.getByRole('link',{name:'スタジオ公式LINEで相談する ↗'}).isVisible());
    fail=false;await page.locator('#cf-retry-selection').click();await page.locator('#cf-copy').waitFor();
    // Single-flight and hourly budget, including forced retries.
    const countBefore=requests;hold=true;const pending=page.evaluate(()=>Promise.all([cfRefreshPublished(true),cfRefreshPublished(true)]));await page.waitForTimeout(100);hold=false;release?.();await pending;assert.equal(requests,countBefore+1);
    await page.evaluate(async()=>{for(let i=0;i<30;i++)await cfRefreshPublished(true)});assert(requests<=22,'refresh budget must cap per-hour requests plus initial loads');
    report.scenarios.push('A–N: draft/history/class isolation/copy failure/metadata change/CLOSE/CANCELLED/INQUIRY_ONLY/full/disappearance/stale/network/single-flight/budget');
   }
   report.widths.push({width,status:'PASS'});await context.close();
  }
  assert.equal(report.errors.length,0);fs.writeFileSync(`${evidence}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
