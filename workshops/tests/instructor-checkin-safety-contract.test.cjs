const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const html=fs.readFileSync(path.join(__dirname,'../instructor/index.html'),'utf8');
test('VC1: paid arrivals are one-tap; unpaid and undo require confirmation',()=>{assert.match(html,/!next\|\|person\.paymentStatus!=='paid'/);assert.match(html,/支払状態は変更されません/);});
test('VC2: search includes reservation ID and participant name',()=>{assert.match(html,/氏名・予約番号で検索/);assert.match(html,/String\(p\.id\|\|''\)\.toLowerCase\(\)\.includes\(q\)/);});
test('VC3: payment queue and recovery messages are visible',()=>{assert.match(html,/id="checkinPendingPayment"/);assert.match(html,/受付済でも未入金/);assert.match(html,/再読込して受付状態を確認/);});
