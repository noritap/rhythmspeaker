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
const rental=read('rental/index.html');
for(const label of ['通常レンタルを相談する','STARTER SUPPORTを相談する','レンタルをLINEで相談する']){
 const m=rental.match(new RegExp('<a[^>]+href="([^"]+)"[^>]*>\\s*'+label+'(?:\\s*<span[^>]*>[\\s\\S]*?<\\/span>)?\\s*<\\/a>'));
 assert.ok(m,label+' CTA must exist in rental-first redesign');
 assert.ok(m[1].includes('line.me/R/oaMessage/%40ypk3334t'),label+' must retain a tailored inquiry message');
}
for(const anchor of ['starter','starter-detail','plans','booking','photos','access'])assert.ok(rental.includes('id="'+anchor+'"'),'rental anchor '+anchor+' must remain');
assert.match(rental,/3,500 TIPS/);
assert.match(rental,/対象利益の30%/);
assert.match(rental,/企画全体の赤字/);

const workshops=read('workshops/index.html');
assert.match(workshops,/href="#explore">開催予定から探す/);
assert.doesNotMatch(workshops,/href="https:\/\/noritap\.github\.io\/rhythmspeaker\/workshops\/" target="_blank"/);
console.log('Sitewide Journey UX: inline help, context transfer, safe fallbacks — PASS');
