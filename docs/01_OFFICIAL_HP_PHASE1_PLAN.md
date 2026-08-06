# Rhythm Speaker Official HP｜Multi-page Phase 1 Plan v0.1

## 1. Purpose

この設計書は、現在の初心者向け1ページLPを壊さずに、Rhythm Speaker公式Webを段階的に複数ページ化するためのPhase 1方針を定義する。

目的は、見た目の刷新ではなく、以下を同時に満たすこと。

- 新規顧客が迷わず体験予約まで進める
- 初心者向けLPのCV導線を維持する
- 検索流入をページ単位で獲得できる
- 今後のクラス・講師・TAP HUB・Dance Park等の情報増加に耐える
- 管理者・開発者・AIが更新箇所を判断しやすくする
- 静的HTML/CSSで達成できる間は、不要なフレームワーク移行を避ける

---

## 2. Phase 1 Executive Decision

Phase 1では、現在の `/` をそのまま初心者向けCVページとして維持する。

既存LPを `/beginner` へ移動したり、トップページを全面的に作り直したりしない。

理由:

- 現在の `/` はすでに公開・実機確認済み
- 初心者理解 → 不安解消 → LINE体験予約の流れが成立している
- 既存URLを動かすSEO / リンク切れ / 公開事故のリスクが不要
- 公式HP化は、新規ページを追加して役割分担する方が安全

Phase 1の基本方針:

```text
現在の / を守る
    ↓
高価値ページを追加する
    ↓
共通導線を整える
    ↓
検索資産を増やす
    ↓
必要になった段階でトップページ再設計を検討
```

---

## 3. Platform Roles

### GitHub Official Web

役割:

- 集客
- 初心者向け説明
- ブランド理解
- 検索流入
- クラス / 講師 / 料金 / アクセスの説明
- 体験予約への送客
- メディア資産化

### STORES

役割:

- SHOP
- 商品販売

GitHub Official Webの代替として扱わない。

### RS Wallet

役割:

- 認証
- TIPS残高確認
- TIPS利用
- 取引 / 利用履歴確認
- 継続利用時のサービス利用

新規客向けPrimary CTAにしない。

### LINE

役割:

- 初回体験予約
- 問い合わせ
- 個別相談
- コンバージョン

---

## 4. Phase 1 Page Set

Phase 1で先に作るページは、以下の5ページとする。

```text
/about/
/classes/
/trial/
/access/
/faq/
```

既存:

```text
/
```

は初心者向けLPとして継続利用する。

### Priority order

```text
1. /trial/
2. /classes/
3. /access/
4. /about/
5. /faq/
```

---

## 5. Why These Five Pages

### 5.1 `/trial/`｜最優先

目的:

- 体験予約前の不安を1ページで解消
- LINE予約へのCVを強くする
- 「タップダンス 体験 池袋」「初心者 タップダンス 体験」等の検索意図に対応

主内容:

- 初回体験 ¥1,000
- 入会金0円
- タップシューズ無料レンタル
- ウェア無料レンタル
- 体験の流れ
- 所要時間
- 来店時間
- 持ち物不要
- 初心者向け安心情報
- LINE予約CTA

Primary CTA:

`LINEで初回体験を予約する`

### 5.2 `/classes/`

目的:

- 「自分に合うクラスがあるか」を判断できるようにする
- クラス情報の追加を `/` に積み続けない
- 将来 `/classes/step/`, `/classes/tap/`, `/classes/gvc/` へ拡張する入口にする

Phase 1では、確定情報のみ掲載。

現時点で少なくとも:

- STEP 超初級
- STEP 初級

を明確に説明する。

未確定・変更頻度の高いクラス情報を推測で追加しない。

### 5.3 `/access/`

目的:

- 池袋駅からの来店不安を減らす
- Local SEOを強化
- Google Maps / 駅徒歩情報を独立ページで明確化

必須:

- TOKYO IKEBUKURO
- 池袋駅徒歩3分
- 地図
- 最寄り出口 / 来店導線は確認済み情報のみ
- 営業情報を固定値で断定しすぎない

### 5.4 `/about/`

目的:

- Rhythm Speakerの教育思想・WEB連動型の意味を説明
- ブランド理解を深める
- 単なる「タップ教室」ではなく、継続しやすい学習環境として位置づける

主内容:

- WEB連動型 = 自由予約 × 事前決済 × デジタル一元管理
- ゼロバリア教育OS
- 初心者 / 年齢 / 体力への設計思想
- Rhythm Speakerの役割
- 古庄里好の教育アプローチ

### 5.5 `/faq/`

目的:

- `/` のFAQ肥大化を防ぐ
- 検索意図のロングテールを拾う
- 予約前の離脱理由を減らす

Phase 1で扱う質問例:

- 50代・60代から始められるか
- 完全初心者でも大丈夫か
- 手ぶらで行けるか
- 体験前にRS Wallet登録が必要か
- 服装
- シューズ
- 予約方法
- 体験料金

---

## 6. Future Pages｜Phase 1では作らない

以下は将来候補だが、Phase 1では作らない。

```text
/beginner/
/classes/step/
/classes/tap/
/classes/gvc/
/instructors/
/schedule/
/price/
/wallet/
/dance-park/
/rental/
/tap-hub/
/media/
/shop/
/contact/
```

理由:

- Phase 1でページ数を増やしすぎない
- まず検索 / CVに直結する5ページで効果を見る
- 料金・スケジュール・サービス情報は変更頻度が高く、設計を先に固定しすぎない

---

## 7. Recommended Static Structure

Phase 1では静的HTML/CSSを継続する。

候補構成:

```text
rhythmspeaker/
├── README.md
├── index.html
├── style.css
├── hero.jpg
├── logo.png
├── tap-dance-instructor-furusho-noritaka.jpg
├── docs/
│   └── 01_OFFICIAL_HP_PHASE1_PLAN.md
├── trial/
│   └── index.html
├── classes/
│   └── index.html
├── access/
│   └── index.html
├── about/
│   └── index.html
└── faq/
    └── index.html
```

Phase 1開始時点では、無理に `assets/`, `components/`, build systemを導入しない。

共通CSSの分離は、実装量を見て必要になった時点で判断する。

---

## 8. Navigation Strategy

現在の `/` には既存ナビゲーションがある。

Phase 1実装時は、以下の優先順位でナビゲーションを再整理する。

推奨:

```text
初めての方
クラス
体験
アクセス
FAQ
```

PCではヘッダー内リンク。

SPでは認知負荷を増やさない。

Primary CTAは常に:

`初回体験を予約する`

とする。

RS WalletはヘッダーPrimary CTAにしない。

左上Rhythm SpeakerロゴのSTORESリンクは、既存仕様として維持するか、公式HP multi-page化との整合を実装時に再検討する。

※Phase 1設計段階では変更しない。

---

## 9. CTA Architecture

全ページでCTAの意味を統一する。

### Primary CTA

```text
初回体験を予約する
```

Destination:

Official LINE

### Secondary CTA

ページ文脈ごとに1つまで。

例:

- クラスを見る
- アクセスを見る
- よくある質問を見る

### RS Wallet

新規顧客向けページでは補助導線。

体験前の登録を要求しているように見せない。

---

## 10. SEO Strategy

Phase 1のSEOは、ページごとに検索意図を分離する。

### `/`

Primary intent:

- タップダンス教室 池袋
- タップダンス 初心者 池袋
- 大人 タップダンス 東京

### `/trial/`

Primary intent:

- タップダンス 体験 池袋
- タップダンス 初心者 体験 東京

### `/classes/`

Primary intent:

- タップダンス クラス 池袋
- 初心者 タップダンス レッスン 東京

### `/access/`

Primary intent:

- タップダンス 池袋駅
- タップダンス教室 豊島区

### `/about/`

Primary intent:

- Rhythm Speaker
- リズムスピーカー タップダンス

### `/faq/`

Primary intent:

- 50代 タップダンス
- 60代 タップダンス
- タップダンス 初心者 不安
- タップシューズ レンタル

タイトル・descriptionは各ページ固有にする。

同一文言の大量複製は避ける。

---

## 11. Content Rules

### FACT

確認できている事業データのみ掲載。

### DESIGN

ページ構造・UI・導線は、目的に合わせて変更可能。

### HYPOTHESIS

SEOキーワード・ユーザー意図は仮説として扱い、Search Console等のデータが得られれば更新する。

### UNKNOWN

未確認の料金・クラス本数・営業時間・講師情報・RS Wallet機能は断定しない。

---

## 12. Business Data Safety

以下は実装前に必ず現行情報と照合する。

- 初回体験料金
- 入会金
- TIPS仕様
- クラス名
- クラス時間
- 講師情報
- LINE導線
- アクセス
- レンタル条件
- スケジュール
- 営業時間

RS Walletについて安全に説明できる範囲:

- 認証
- TIPS残高確認
- TIPS利用
- 取引 / 利用履歴確認
- 継続利用時のサービス利用

予約・決済・デジタルチケット管理を、別途確認せず追加しない。

---

## 13. Design System Direction

現行の世界観を継承する。

### KEEP

- 木のタップフロア
- 黒 / 白 / ダークトーン
- タップシューズ / 足元
- リズム
- ベクトル
- 足跡
- 余白を使った情報整理

### AVOID

- 子ども向けスクール感
- 過剰なストリート感
- セール / 値引き中心の見せ方
- 装飾優先
- 1画面に大量の選択肢

---

## 14. Mobile-first Requirements

Phase 1の全ページで以下を満たす。

- 横スクロールなし
- Primary CTAが明確
- 固定UI同士が重ならない
- 文字サイズが小さすぎない
- 1カラムで自然に読める
- タップ領域を十分確保
- PC専用情報設計をSPへ押し込まない

---

## 15. Phase 1 Implementation Order

実装順:

```text
STEP 1  /trial/
STEP 2  /classes/
STEP 3  /access/
STEP 4  /about/
STEP 5  /faq/
STEP 6  各ページから相互導線
STEP 7  / のナビゲーション最小更新
STEP 8  PC / SP / 外部リンク検証
STEP 9  GitHub Pages公開確認
```

### 最初に `/trial/` を作る理由

最短でCVに近いページだから。

内部構造整理より、体験予約に近いページを先に資産化する。

---

## 16. Phase 1 Done Condition

Phase 1完了条件:

```text
[ ] / は現行CVを維持
[ ] /trial/ 公開
[ ] /classes/ 公開
[ ] /access/ 公開
[ ] /about/ 公開
[ ] /faq/ 公開
[ ] 全ページでPrimary CTA統一
[ ] LINE導線確認
[ ] PC確認
[ ] SP確認
[ ] ページ間リンク確認
[ ] title / meta description固有化
[ ] GitHub Pages実公開確認
```

---

## 17. Do Not Do in Phase 1

- React / Next.js / Astro全面移行
- CMS導入
- 予約システム新規開発
- RS Wallet統合開発
- `/` の全面デザイン刷新
- 独自ドメイン移行
- 画像の大量追加
- クラス情報の推測掲載
- STORESを閉じる / 統合する

これらはPhase 1の目的ではない。

---

## 18. Next Action

次の実装タスク:

```text
Official HP Phase 1｜STEP 1
/trial/ v0.1 を作成する
```

実装前に、現在の `/` にある以下を正本として再確認する。

- 体験料金
- 無料レンタル
- 体験の流れ
- LINE URL
- 初心者向けFAQ
- アクセスへの導線

そのうえで `/trial/` を、単なるLPコピーではなく「体験予約専用ページ」として設計する。

---

## 19. Current Status

```text
Beginner LP v0.2                  LIVE
Navigation utilities v0.1        LIVE
README v0.1                      LIVE
Official HP Phase 1 Plan v0.1    READY FOR REVIEW
First implementation target      /trial/
```
