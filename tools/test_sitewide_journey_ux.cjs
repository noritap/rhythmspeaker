'use strict';
// Contract tests for the user-facing paths changed in the Sitewide Journey UX PR.
// These verify safe navigation intent, not third-party LINE delivery or booking completion.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const trial=read('trial/apply/index.html');
assert.match(trial,/<form id="apply">/);
assert.match(trial,/<section class="apply-help"/);
assert.match(trial,/<details><summary>体験当日の流れ・持ち物を確認する<\/summary>/);
assert.match(trial,/どのクラスを選ぶか迷ったら/);
assert.doesNotMatch(trial,/href="\.\.\/">体験の詳細・持ち物を見る/);
assert.doesNotMatch(trial,/href="\.\.\/\.\.\/classes\/">クラスを見る/);
assert.match(trial,/id="line"/);
assert.match(trial,/id="mail"/);
assert.match(trial,/id="copy"/);

const finder=read('assets/ux-lab/class-finder.js');
assert.match(finder,/const requestedType=params\?\.get\('type'\)/);
assert.match(finder,/cfClassFamily\(requestedType\)/);
assert.match(finder,/cfTypes\.includes\(family\)/);
assert.match(finder,/q\.set\('type',cfState\.type\)/);
assert.match(finder,/q\.set\('teacher',cfState\.query\)/);
assert.match(finder,/params\?\.get\('class'\)/);
assert.match(finder,/cfStale/);
const app=read('assets/ux-lab/app.js');
assert.match(app,/このクラスの開催予定を見る/);
assert.match(app,/担当の開催予定・予約相談を見る/);

for(const [path,label] of [['step','STEP'],['tap','TAP'],['stretch','STRETCH'],['isolation','ISOLATION'],['bar-method','BAR METHOD'],['hiit','HIIT']]){
 const html=read('classes/'+path+'/index.html');
 assert.ok(html.includes('href="../../schedule/?type='+encodeURIComponent(label)+'"'),path+' must carry its class type');
 assert.match(html,/trial\/apply\/|LINEで相談/);
}
// STEP page UX contract: reduce repeated CTAs without removing a booking safety notice.
const stepPage=read('classes/step/index.html');
const stepApplyLinks=stepPage.split('href="../../trial/apply/?class=STEP"').length-1;
assert.equal(stepApplyLinks,4,'STEP must keep nav, hero, start and footer application routes only');
assert.doesNotMatch(stepPage,/step-level-decision|step-instructor-followup|id="method"/);
for(const id of ['levels','start','instructors','faq','booking']){
 assert.ok(stepPage.includes('id="'+id+'"'),'STEP keeps #'+id+' navigation destination');
}
assert.match(stepPage,/日時は送信時点では未確定/);
assert.match(stepPage,/フォームを開いたら予約が確定しますか？/);
assert.ok(stepPage.includes('href="../tap/"'),'STEP to TAP route remains');
assert.ok(stepPage.includes('href="../../schedule/?type=STEP"'),'STEP class filter route remains');

for(const [slug,teacher] of [['furusho','古庄里好'],['homma','本間茂樹'],['mifa','MiFa-san'],['niu','丹生良彬'],['okudaira','奥平崇史'],['sasasa','さささ']]){
 const html=read('instructors/'+slug+'/index.html');
 assert.ok(html.includes('href="../../schedule/?teacher='+encodeURIComponent(teacher)+'"'),slug+' must carry teacher name');
 assert.match(html,/lin\.ee\//);
}

const pricing=read('pricing/index.html');
for(const [key,label] of [['standard10','スタンダード10'],['premium25','プレミアム25'],['premium50','プレミアム50']]){
 const card=pricing.match(new RegExp('<article class="plan-card" data-plan="'+key+'">([\\s\\S]*?)<\\/article>'))?.[1];
 assert.ok(card,key+' card must exist');
 assert.ok(card.includes(encodeURIComponent(label)),label+' must be present in its LINE message');
 assert.match(card,/line\.me\/R\/oaMessage\/%40ypk3334t/);
}
const landing=read('rental/index.html');
const rental=read('rental/booking.html');
for(const label of ['通常レンタル','平日朝割引','深夜6時間パック','シェアレンタル']){
 assert.ok(rental.includes(label),label+' automatic rental rate must exist');
}
assert.match(rental,/data-use-mode="private"/);
assert.match(rental,/data-use-mode="share"/);
assert.match(rental,/const autoPlan=/);
assert.match(rental,/id="rental-request"/);
assert.match(landing,/id="rental-google-calendar"/);
assert.match(rental,/rsr-availability-optional/);
assert.match(rental,/id="rental-availability-preview"/);
assert.match(rental,/id="rental-google-calendar"/);
assert.match(rental,/id="rental-availability-lazy-load"/);
assert.match(rental,/スタジオの予定を見る/);
assert.match(rental,/このページで予定を見る/);
assert.match(rental,/Googleカレンダーを開く/);
assert.match(rental,/inMorning\(dateInput\.value\)/);
assert.match(rental,/通常レンタルは23:00まで/);
assert.match(read('docs/RENTAL_V5_RELEASE_SPEC_20261107.md'),/予約成立条件/);
assert.match(read('docs/RENTAL_V5_RELEASE_SPEC_20261107.md'),/追加24枚のGitHub画像バイナリは未アップロード/);

assert.match(rental,/calendar\.google\.com\/calendar\/u\/0\/embed/);
assert.match(rental,/mode=WEEK/);
assert.match(rental,/ctz=Asia%2FTokyo/);
assert.match(rental,/予定が表示されていない時間も予約可能とは限りません/);
assert.match(rental,/frame\.setAttribute\('src',frame\.dataset\.src\)/);
assert.doesNotMatch(rental,/%230B8043%22|pli=1/);
assert.ok(rental.indexOf('id="rental-availability"')<rental.indexOf('id="rental-calendar"'),'Availability context should precede preferred-date selector');

assert.match(landing,/assets\/ux-lab\/app\.css/);
assert.match(landing,/data-ux-source="sites-v6"/);
assert.match(landing,/id="menu-button"/);
assert.match(landing,/id="landing-shared-navigation"/);
assert.match(landing,/id="rsr-brand-v4"/);
assert.match(landing,/class="context-nav"/);
assert.match(landing,/class="brand-name"/);
assert.match(landing,/初回体験 ¥1,000/);
assert.match(landing,/池袋の<br>レンタルスタジオ。/);
assert.doesNotMatch(rental,/<section class="rsr-quickbar"/);
assert.match(rental,/日時を選んで、LINEで相談。/);
assert.match(rental,/class="rsr-hero-media"/);
assert.match(rental,/class="button primary rsr-submit"/);
assert.doesNotMatch(rental,/href="\.\.\/style\.css"/);
assert.doesNotMatch(rental,/class="nav-links"/);

assert.match(rental,/data-use-mode="private"/);
assert.match(rental,/type.value===\x27深夜6時間パック\x27/);
assert.match(rental,/data-use-mode="share"/);
assert.match(rental,/validatePlan/);
assert.match(rental,/line\.me\/R\/oaMessage\/%40ypk3334t/);
assert.doesNotMatch(rental,/3,500 TIPS|400 TIPS/);
for(const id of ['rental-calendar','rental-calendar-days','rental-month-label','rental-prev-month','rental-next-month','rental-time','rental-summary-total','rental-summary-plan']){
 assert.ok(rental.includes('id="'+id+'"'),'Rental calendar UI keeps '+id);
}
assert.match(rental,/const renderCalendar=/);
assert.match(rental,/const renderTimes=/);
assert.match(rental,/minutes<=1320;minutes\+=30/);
assert.match(rental,/type\.value==='通常レンタル'&&minutesOf\(timeInput\.value\)\+durations\(\)\*60>1380/);
assert.match(rental,/end>1380/);
assert.match(rental,/const estimate=/);
assert.match(rental,/const validatePlan=/);
assert.match(rental,/const isPastStart=/);
assert.match(rental,/jstNow/);
assert.match(rental,/<option value="STARTER SUPPORT">/);
assert.match(rental,/data-rental-choice="STARTER SUPPORT"/);
assert.match(rental,/id="rental-pricing"/);
assert.match(rental,/rsr-pricing-compact/);
assert.match(rental,/<option selected>1時間<\/option>/);
assert.match(rental,/開始希望時刻（30分単位）/);
assert.match(rental,/料金の適用条件・キャンセルについて/);
assert.match(rental,/const isNightSelection=/);
assert.match(rental,/if\(isNightSelection\(\)\)duration.value='6時間'/);
assert.match(rental,/nextDay\(dateInput.value\)\+' 00:00〜06:00'/);
assert.match(rental,/翌日0時〜6時（深夜パック）/);
assert.match(rental,/o.value!=='00:00'&&isPastStart\(dateInput.value,o.value\)/);
assert.ok(!rental.includes('class="rsr-price-card"'), 'Remove duplicate plan cards from the primary rental journey');

assert.match(rental,/aria-pressed/);
assert.match(rental,/'通常レンタル':3500/);
assert.match(rental,/'平日朝割引':1500/);
assert.match(rental,/'深夜6時間パック':4000/);
assert.match(rental,/'シェアレンタル':500/);
assert.match(landing,/空き状況はLINEで確認/);
assert.ok(landing.indexOf('id="landing-booking"')<landing.indexOf('id="studio-gallery"'),'Booking must precede long gallery');
assert.match(landing,/id="studio-floorplan"/);
assert.match(landing,/id="studio-floorplan-image"/);
assert.match(landing,/id="studio-floorplan-frame"/);
assert.match(landing,/id="studio-floorplan-unavailable"/);
assert.match(landing,/id="landing-floorplan-release-gate"/);
assert.match(landing,/rhythm-speaker-b1f-floorplan-v1\.webp/);
assert.match(landing,/probe\.onload=\(\)=>\{img\.src=asset;frame\.hidden=false;pending\.hidden=true/);
assert.match(landing,/probe\.onerror=\(\)=>\{frame\.hidden=true;pending\.hidden=false/);
assert.ok(landing.indexOf('id="studio-gallery"')<landing.indexOf('id="studio-floorplan"'));
assert.ok(rental.indexOf('id="studio-floorplan"')<rental.indexOf('id="studio-spec"'));
const floorplanDoc=read('docs/STUDIO_FLOORPLAN_V1_20261107.md');
assert.match(floorplanDoc,/画像バイナリはこのPRには含まれません/);
assert.match(floorplanDoc,/1920×1080px/);

assert.match(landing,/class="rsr-visual-feature"/);
assert.match(landing,/class="rsr-visual-secondary"/);
assert.match(landing,/class="rsr-visual-more"/);
assert.match(landing,/id="rsr-photo-gallery-v42"/);
assert.match(landing,/assets\/images\/studio\/reference\/studio-front-wide-angle-dance-floor-overview\.jpg/);
assert.match(landing,/assets\/images\/studio\/reference\/studio-wide-angle-dance-floor-and-mirror\.jpg/);
assert.doesNotMatch(landing,/library\/2026-11\/(?:web|originals)\//);
const photoLib=JSON.parse(read('data/studio-photo-library.json'));
assert.strictEqual(photoLib.image_count,24,'24 supplied photos must be indexed');
assert.strictEqual(photoLib.photos.length,24,'one index per supplied photo');
assert.strictEqual(photoLib.photos.filter(x=>x.priority_tier==='P1').length,4);
assert.ok(photoLib.photos.every(x=>x.asset_state==='PENDING_BINARY_UPLOAD'),'do not pretend binary photos are uploaded');
assert.ok(photoLib.photos.every(x=>x.public_image_url===null),'unpublished files must not have a public URL');
assert.ok(photoLib.presentation_strategy.future_swap_targets.includes('RS-STUDIO-0869'));
assert.ok(photoLib.photos.every(x=>x.review_status==='VISUAL_CONTENT_CHECKED_NOT_PUBLICATION_APPROVED'));
const publicPhotos=JSON.parse(read('data/studio-photo-library-public.json'));
assert.deepStrictEqual(publicPhotos.published,{},'Do not expose unuploaded photos as published');
assert.match(landing,/data-studio-photo-id="0870"/);
assert.match(landing,/data-studio-photo-id="0872"/);
assert.match(landing,/data-studio-photo-id="0873"/);
assert.doesNotMatch(landing,/data-studio-photo-id="0863"/);
assert.doesNotMatch(landing,/data-studio-photo-id="0864"/);
assert.doesNotMatch(landing,/data-studio-photo-id="0869"/);
assert.match(landing,/assets\/js\/studio-photo-library\.js/);
const about=read('about/index.html');
assert.match(about,/id="studio-photo-story"/);
assert.match(about,/data-studio-photo-id="0870"/);
assert.match(about,/data-studio-photo-id="0873"/);
assert.doesNotMatch(about,/data-studio-photo-id="0869"/);
assert.doesNotMatch(rental,/更衣スペース ↗|地下への入口・階段 ↗/);
assert.doesNotMatch(about,/着替えのスペース ↗/);
assert.match(photoLib.photos.find(x=>x.id==='RS-STUDIO-0869').verified_visual_description_ja,/更衣スペース/);
assert.match(photoLib.photos.find(x=>x.id==='RS-STUDIO-0864').verified_visual_description_ja,/地下/);
assert.match(about,/assets\/js\/studio-photo-library\.js/);
const studioLoader=read('assets/js/studio-photo-library.js');
assert.match(studioLoader,/studio-photo-library-public\.json/);
assert.match(studioLoader,/probe\.onload/);
assert.match(studioLoader,/if\(typeof entry!=='string'/);
assert.match(read('docs/STUDIO_PHOTO_V6_IMPLEMENTATION_20261107.md'),/6枚のコミットと本番URL検証/);




const workshops=read('workshops/index.html');
assert.match(workshops,/href="#explore">開催予定から探す/);
assert.doesNotMatch(workshops,/href="https:\/\/noritap\.github\.io\/rhythmspeaker\/workshops\/" target="_blank"/);
console.log('Sitewide Journey UX: inline help, context transfer, safe fallbacks — PASS');

assert.match(landing,/href="night\/"/);
assert.match(landing,/href="coworking\/"/);
assert.match(read('rental/share/index.html'),/初めての方はLINEでご連絡ください/);
