'use strict';
// Sitewide public-copy regression guard. Read-only; no network, credentials, or production data writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const has = (p, s) => assert.ok(read(p).includes(s), p + ' must keep: ' + s);
const lacks = (p, s) => assert.ok(!read(p).includes(s), p + ' must not repeat: ' + s);

function allHtml(dir = root) {
  const result = [];
  for (const d of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['.git', 'node_modules', '.cache'].includes(d.name)) continue;
    const full = path.join(dir, d.name);
    if (d.isDirectory()) result.push(...allHtml(full));
    else if (d.isFile() && d.name.endsWith('.html')) result.push(path.relative(root, full));
  }
  return result;
}
const pages = allHtml();
assert.ok(pages.length >= 48, 'Protect published HTML pages from accidental disappearance');
assert.equal(new Set(pages).size, pages.length);

for (const page of ['index.html', 'about/index.html', 'access/index.html', 'faq/index.html', 'classes/index.html', 'instructors/index.html']) {
  lacks(page, 'クラスが決まっていなくても、体験前に相談できます。');
}
for (const page of ['classes/bar-method/index.html', 'classes/isolation/index.html']) {
  lacks(page, '現時点ではクラスの役割と担当情報を先に整理し');
  lacks(page, '追加担当者は未確認のため掲載していません。');
  has(page, '担当講師');
}
lacks('classes/hiit/index.html', '未確認情報を掲載せず');
lacks('classes/hiit/index.html', 'EVIDENCE FIRST');
lacks('broadcast/index.html', 'Episode・Program・Peopleの正本データ');
lacks('music/index.html', 'Primary Listening Surface');
lacks('ecosystem/index.html', 'メールはメールアプリを開きます');
lacks('rss/index.html', '作品の公開日時は未登録のため');
lacks('rss-theater/index.html', '作品の公開日時は未登録のため');
lacks('instructors/index.html', '担当クラス・指導内容は確認してご案内します。');

// Static/dynamic route parity and clear next steps.
const app = read('assets/ux-lab/app.js');
assert.ok(!app.includes('クラスが決まっていなくても、体験前に相談できます。'));
assert.ok(!app.includes('最初からクラス名を知らなくても大丈夫です。'));
has('trial/apply/index.html', 'スタジオから「予約確定」の返信');
has('trial/index.html', 'スタジオからの「予約確定」の返信');
has('schedule/index.html', '開催予定から選ぶ');
has('assets/ux-lab/class-finder.js', 'スタジオから「予約確定」の返信');
has('assets/ux-lab/class-finder.js', '開催情報を再読み込み');

// Don't trade clarity for deletion of material decisions, legal/operational details.
has('pricing/index.html', '3,500 TIPS');
has('pricing/index.html', '1,000');
has('trial/index.html', 'シューズ');
has('access/index.html', '西池袋3-22-10');
has('trial/apply/index.html', 'https://line.me/R/oaMessage/%40ypk3334t/');
has('instructors/homma/index.html', 'https://lin.ee/zC5YLe7');
has('instructors/homma/index.html', 'https://lin.ee/7Dk4s8o');
has('rental/index.html', '30%');
has('workshops/event.html', '予約を受け付けました');
has('instructor-registration/index.html', '個人情報');
has('classes/step/index.html', 'STEP超初級');
has('music/albums/saa-ittemiyouka/index.html', 'album/saa-ittemiyouka');
has('music/app.js', 'THE TRACKLIST');
has('broadcast/programs/ayako-no-heya/index.html', 'あやこの部屋');

console.log('PASS: ' + pages.length + ' HTML pages accounted for; core copy and operational boundaries protected.');
