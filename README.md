# Rhythm Speaker Web

【WEB連動型】タップダンス教室 リズムスピーカーの公式Web / Main HP repository。

Status: LIVE / EXPANDING AS SERVICE HUB
Canonical Public URL: https://noritap.github.io/rhythmspeaker/

## 1. Project identity

このRepositoryは、Rhythm Speakerの公式Main HP / Service Hubを管理する。

主目的:
- Rhythm Speaker全体の理解
- 初心者の不安軽減
- 初回体験CV
- レッスン / スタジオ / メディア / 音楽 / イベント / 教育 / SHOP等の公開導線整理
- 各専用サービス・外部Platformへの正しいRouting

決済アプリ、認証、TIPS台帳、外部Platform本体の実装Repositoryではない。

## 2. Public surface roles

### Rhythm Speaker Official Web
URL: https://noritap.github.io/rhythmspeaker/
Role: MAIN HP / SERVICE HUB / TRIAL CONVERSION

### Rhythm Speaker Official SHOP
URL: https://rhythmspeaker.stores.jp/
Platform: STORES
Role: SHOP / COMMERCE ONLY
Rule: STORESをMain HPとして表記・再設計しない。

### RS Wallet
URL: https://tips-app-seven.vercel.app/
Role: 継続利用者向けMember Utility
Safe public description: 認証 / TIPS残高確認 / TIPS利用 / 取引・利用履歴 / サービス利用
Rule: 新規顧客のPrimary CTAにはしない。

### Official LINE
URL: https://lin.ee/zC5YLe7
Role: 初回体験予約 / 問い合わせ / 個別相談 / Conversion

### YouTube
URL: https://www.youtube.com/channel/UCsCznku0uyE4718G5wfj_2Q
Role: WATCH / BROADCAST distribution

### Instagram
URL: https://www.instagram.com/rhythmspeaker_ikebukuro/
Role: SNS / Marketing / discovery

## 3. Business architecture source

Internal business architecture Source of Truth:
- `noritap/RS_STUDIO_OS`
- `00_CORE/05_RHYTHM_SPEAKER_BUSINESS_ARCHITECTURE.md`
- `00_CORE/06_DIVISION_OPERATING_MATRIX.md`

Internal 10 divisions:
1. STUDIO
2. BROADCAST
3. MUSIC LABEL
4. SHOP
5. EVENTS
6. EDUCATION
7. COMMUNITY
8. B2B / PARTNERS
9. MEDIA / MARKETING
10. MANAGEMENT

Public Webは内部10部門をそのまま見せず、以下7カテゴリへ圧縮する。

1. STUDIO — Lesson / Rental / Facility
2. WATCH — YouTube / Rhythm Speaker Show / Broadcast
3. MUSIC — Rhythm Speaker Music
4. EVENTS — Event / Workshop / Collaboration
5. LEARN — Education / Materials / Methods
6. SHOP — STORES
7. ABOUT — Brand / Access / FAQ / Contact

公開Directory:
- `/ecosystem/`

## 4. Current funnel

```text
検索 / YouTube / SNS / Event
        ↓
Rhythm Speaker Official Web
        ↓
理解 / サービス発見
        ↓
初回体験を希望する場合はOfficial LINE
        ↓
体験
        ↓
継続利用
        ↓
RS Wallet / TIPS / STUDIO / SHOP / EVENTS / LEARN等
```

Primary CTA:
`初回体験を予約する`

Primary CTAを、RS WalletやSHOPへ置き換えない。

## 5. Current primary pages

```text
/
/trial/
/classes/
/about/
/ecosystem/
/faq/
/access/
/rss/
```

Additional public surfaces may include `/workshops/` and individual RSS / event pages.

## 6. Navigation governance

Canonical Navigation Contract:
- `docs/03_NAVIGATION_REGISTRY.md`

Current NAV version:
- `RS-NAV-2`

Global Navigation:
- 教室トップ
- 初回体験
- クラス
- 教室紹介
- サービス一覧
- FAQ
- アクセス
- RSS
- SHOP

Automation:
- `tools/navigation_sync.py`
- `tools/navigation_audit.py --strict`
- `.github/workflows/navigation-sync.yml`
- `.github/workflows/navigation-audit.yml`

Navigation変更はRegistryを先に変更し、全Primary Pageを同期し、CI PASS後にmergeする。

## 7. UX policy

- Mobile First
- CTA First
- Low Cognitive Load
- Beginner First
- Accessibility
- 事業全体は発見可能にするが、初回客へ全情報を同時表示しない

World / Design:
- 木のタップフロア
- 黒 / 白 / ダークトーン
- タップシューズ / 足元
- リズム / ベクトル / 足跡

Avoid:
- 子ども向けダンススクール風
- 過剰なストリート表現
- 値引き中心
- 情報過多
- 過剰装飾

## 8. Business data rules

推測で変更しない:
- 料金
- TIPS仕様
- クラス名
- 講師
- LINE導線
- RS Wallet機能
- Access
- レンタル条件
- イベント販売条件

確認済み現行事実としてRepositoryに記録されているもの:
- 初回体験 ¥1,000
- 入会金 0円
- タップシューズ無料レンタル
- ウェア無料レンタル
- 池袋駅徒歩3分

## 9. New page / new site routing

新しいサービスを公開する前に:
1. RS_STUDIO_OSの10部門でPrimary Ownerを決定
2. 公開7カテゴリを決定
3. 既存Official Web内Pageで足りるか確認
4. 独立Siteが必要な場合のみRevenue Web Asset RegistryへRouting
5. `/ecosystem/` または適切なParent Hubへ接続
6. Navigation / return route / canonical URLを確認

Default:
新サービス = 新HP、とはしない。

## 10. Git / release policy

```text
main
↓
feature branch
↓
implementation
↓
PC / SP check
↓
Navigation / link / business-data validation
↓
Pull Request
↓
CI PASS
↓
main merge
↓
public URL verification
```

GitHub Pages:
- Source: main
- Folder: /(root)

公開判定はGitHub Actions表示だけで断定せず、mainと実URLの両方を確認する。

## 11. Do not touch casually

- React / Next.js / Astro等への全面移行
- CMS導入
- 大規模CSSリファクタ
- 決済 / auth / TIPS / production DB
- RS Wallet機能の推測拡張
- 画像や旧URLの参照確認なし削除
- STORESへのMain HP機能再集約

## 12. Development priority

1. 新規顧客の理解 / 初回体験CV
2. STUDIOサービス発見性
3. SHOP / EVENTS等の収益導線
4. 事業データ正確性
5. Mobile UX
6. SEO / content asset
7. Public 7-category IA拡張
8. Automation / maintainability
9. 技術高度化

構造美や技術的高度化を事業成果より優先しない。

## 13. Current status

```text
Official Main HP                LIVE
Beginner / Trial funnel         LIVE
Primary multi-page site         LIVE
Ecosystem Directory             LIVE
RS-NAV-2                        LIVE
Desktop / Mobile nav sync       ENFORCED BY CI
STORES role                     OFFICIAL SHOP
RS Wallet role                  MEMBER UTILITY
Public 7-category architecture  ACTIVE / EXPANDING
```
