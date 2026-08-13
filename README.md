# Rhythm Speaker Web

【WEB連動型】タップダンス教室 リズムスピーカーの公式Webリポジトリです。

現在の `main` は、初心者向けLPとPhase 1の5ページを統合した静的サイトを GitHub Pages で公開しています。

## 1. Project identity

このリポジトリの役割は、Rhythm Speakerの新規顧客向けWeb導線を管理することです。

主目的は以下です。

- Rhythm Speakerとは何かを理解してもらう
- 初心者の不安を減らす
- 体験レッスンへ案内する
- 継続利用時のRS Wallet / TIPSとの役割分担を説明する
- 今後、公式HPの複数ページ化へ拡張する

このリポジトリは、決済アプリや予約システムそのものを実装する場所ではありません。

## 2. Public URLs

- GitHub Pages: https://noritap.github.io/rhythmspeaker/
- Main HP / STORES: https://rhythmspeaker.stores.jp/
- RS Wallet: https://tips-app-seven.vercel.app/
- Official LINE: https://lin.ee/zC5YLe7
- Instagram: https://www.instagram.com/rhythmspeaker_ikebukuro/
- YouTube: https://www.youtube.com/channel/UCsCznku0uyE4718G5wfj_2Q

## 3. Service / platform roles

### GitHub official web

役割:

- 集客
- 初心者向け説明
- ブランド理解
- 検索流入
- 体験導線
- メディア資産化

初心者向けLPを入口に、体験・クラス・アクセス・教室紹介・FAQへ役割分担しています。

### STORES

役割:

- 商品販売
- SHOP機能

STORESを本リポジトリへ無理に統合しません。

### RS Wallet

役割:

- 認証
- TIPS残高確認
- TIPS利用
- 取引 / 利用履歴確認
- 継続利用時のサービス利用

RS Walletを、予約・決済・デジタルチケット管理システムとして断定しないでください。現在Web上で安全に説明できる範囲は、認証・TIPS残高・TIPS利用・取引 / 利用履歴・サービス利用です。

### LINE

役割:

- 初回体験予約
- 問い合わせ
- 個別相談
- コンバージョン

## 4. Current funnel

現在の基本導線は以下です。

```text
検索 / YouTube / SNS
        ↓
GitHub公式Web
        ↓
Rhythm Speakerを理解
        ↓
LINEで初回体験予約
        ↓
体験レッスン
        ↓
継続利用
        ↓
RS Wallet / TIPS
```

LP上では、RS Walletを新規客の第一CTAにしません。

Primary CTA:

`初回体験を予約する`

Secondary CTA:

`RS Walletを見る`

## 5. Current repository structure

主要な公開ページ:

```text
/
/trial/
/classes/
/access/
/about/
/faq/
```

共通のヘッダーでは、教室内ページ・STORES・Official LINEへ案内します。
PCでは横並びナビ、SP / Tabletでは展開式メニューを使用します。

## 6. Current design / UX policy

基本方針:

- Mobile First
- CTA First
- Low Cognitive Load
- Beginner First
- Accessibility

世界観:

- 木のタップフロア
- 黒 / 白 / ダークトーン
- タップシューズ / 足元
- リズム / ベクトル / 足跡

避けるもの:

- 子ども向けダンススクール風
- 過剰なストリート表現
- 値引き中心の安売り表現
- 情報過多
- 過剰装飾

## 7. Current LP order

現在のLPは概ね以下の順序です。

```text
HERO
↓
初心者の不安
↓
ゼロバリア教育OS
↓
WEB連動型
↓
体験訴求
↓
初心者クラス
↓
体験の流れ
↓
講師
↓
料金
↓
RS Wallet
↓
FAQ
↓
アクセス
↓
Final CTA
```

初心者LPとして、この基本順序を大きく崩さないでください。

## 8. Business data rules

事業データを推測で書き換えないでください。

特に以下は、最新の事業情報と照合してから変更します。

- 体験料金
- TIPS仕様
- クラス名
- 講師情報
- LINE導線
- RS Wallet機能説明
- アクセス
- 無料レンタル条件

確認済みの現行事実:

- 初回体験: ¥1,000
- 入会金: 0円
- タップシューズ無料レンタル
- ウェア無料レンタル
- 池袋駅徒歩3分
- 古庄里好: 週27本レッスン担当経験あり

LINEについては、現在コード内に旧形式URLが残っている箇所がありますが、公式LINEと同一アカウントへの導線でありスマホ実機確認済みです。URL形式だけを理由に緊急修正しないでください。

## 9. Git / branch policy

`main` は公開用です。

大きな修正を `main` へ直接入れません。

基本フロー:

```text
main
↓
feature branch
↓
実装
↓
PC確認
↓
SP確認
↓
GitHub差分確認
↓
Pull Request
↓
main merge
↓
GitHub Pages確認
```

feature branch例:

```text
feature/beginner-lp-v02
feature/navigation-utilities-v01
feature/readme-v01
```

## 10. Release check

変更時は最低限以下を確認します。

### PC

- HERO
- ナビゲーション
- CTA
- 各セクション
- footer
- 外部リンク

### SP

- 横スクロールが出ない
- CTAが重ならない
- 文字サイズが破綻しない
- カードが1カラムで読める
- 固定ボタンが操作を邪魔しない

### External links

- LINE
- STORES
- RS Wallet
- Google Maps
- YouTube
- SNS

## 11. GitHub Pages

公開方式:

```text
Source: Deploy from a branch
Branch: main
Folder: /(root)
```

公開URL:

https://noritap.github.io/rhythmspeaker/

注意:

GitHub Actionsの表示だけで公開成否を断定しません。

過去にActions側が `Queued` / failure 表示でも、実サイトには最新変更が正常反映されていたケースがあります。

最終公開判定は以下の順で行います。

```text
1. main commit確認
2. GitHub Pages設定確認
3. 実公開URLを直接確認
4. 今回変更した対象機能を実際に操作
```

最終的には実サイトの動作確認を優先します。

## 12. Do not touch without review

以下は、必要性を確認せず実行しません。

- React / Next.js / Astro等への全面移行
- CMS導入
- 大規模CSSリファクタ
- index.htmlの全面再構成
- STORESの役割を本サイトへ統合
- RS Walletの機能を推測で拡張記載
- 画像やファイルの即時削除
- mainへの直接大規模変更

静的HTML / CSSで目的を達成できる間は、不要なフレームワーク移行を行いません。

## 13. File review status

2026-08-06時点の構成レビューでは以下を確認しています。

### KEEP

- `.gitattributes`
- `index.html`
- `style.css`
- `hero.jpg`
- `logo.png`
- `tap-dance-instructor-furusho-noritaka.jpg`

### DELETE CANDIDATE / review required

- `instructor-main.jpg`
- `instructor-action.jpg`

`instructor-main.jpg` と `tap-dance-instructor-furusho-noritaka.jpg` はGitHub上で同一blobです。

ただし、削除は参照確認と明示承認後に行います。

## 14. Future information architecture

初心者LPへすべての情報を追加し続けません。

公式HP化の候補構成:

```text
/
/about
/beginner
/trial
/classes
/classes/step
/classes/tap
/classes/gvc
/instructors
/schedule
/price
/wallet
/dance-park
/rental
/tap-hub
/media
/shop
/access
/faq
/contact
```

実装順は事業価値・検索需要・運用負荷を見て決定します。

## 15. Development priority

開発の優先順位は以下です。

```text
1. 新規顧客の理解
2. 体験予約CV
3. 事業データの正確性
4. モバイルUX
5. SEO / 検索資産
6. 運用しやすさ
7. 構造整理
8. 技術的高度化
```

構造美や技術的高度化を、事業成果より優先しません。

## 16. Current status

```text
Beginner LP                     LIVE
Phase 1 five-page set           LIVE
PC / mobile common navigation  LIVE
Back-to-top                     LIVE
Explicit STORES links           LIVE
GitHub Pages                    LIVE
```

このREADMEは、Rhythm Speaker Webを人間・AI・Antigravityが安全に継続開発するための入口ファイルとして管理します。
