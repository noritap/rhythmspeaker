# Rhythm Speaker Web｜NAVIGATION_REGISTRY

Version: 1.2
Status: ACTIVE
Canonical Base URL: https://noritap.github.io/rhythmspeaker/

## Purpose

Rhythm Speaker公式WebのDesktop / Mobile Navigationを1つの正本として管理し、ページ追加時のNavigation Driftを防ぐ。

## Navigation Contract

NAV_VERSION: RS-NAV-2

Order:
1. 教室トップ — /rhythmspeaker/
2. 初回体験 — /rhythmspeaker/trial/
3. クラス — /rhythmspeaker/classes/
4. 教室紹介 — /rhythmspeaker/about/
5. サービス一覧 — /rhythmspeaker/ecosystem/
6. FAQ — /rhythmspeaker/faq/
7. アクセス — /rhythmspeaker/access/
8. RSS — /rhythmspeaker/rss/
9. SHOP — https://rhythmspeaker.stores.jp/

Brand / Home:
- Rhythm Speaker logo → /rhythmspeaker/

Primary CTA:
- 初回体験 / Official LINE

Supporting Surfaces:
- RS Walletは新規客のPrimary CTAにしない
- STORESはRhythm Speaker Official Shopとして扱う
- STORESをMain HPとは呼ばない

## Public Business Grouping

今後の公開情報設計は、内部事業10部門をそのまま表示せず、以下の7カテゴリへ圧縮する。

- STUDIO — Lesson / Rental / Facility
- WATCH — YouTube / Rhythm Speaker Show / Broadcast
- MUSIC — Rhythm Speaker Music
- EVENTS — Event / Workshop / Collaboration
- LEARN — Education / Materials / Methods
- SHOP — STORES
- ABOUT — Brand / Access / FAQ / Contact

現行Global Navigationは既存CVとページ資産を維持しつつ段階移行する。新規ページ追加時は上記7カテゴリのどこに属するか必ず判定する。

## Scope

Primary Pages:
- /
- /trial/
- /classes/
- /about/
- /ecosystem/
- /faq/
- /access/
- /rss/

RSS個別回、Workshop等のLocal Navigationは許可するが、Parent Return Routeを失わない。

## Drift Definition

以下はNavigation Drift:
- サービス一覧が一部ページだけに存在
- RSSが一部ページだけに存在
- DesktopとMobileの項目差
- SHOP表記・hrefの不一致
- STORESを「メインHP」と表記する旧ラベル
- 項目順の不一致
- Parent / Home導線欠落

## Change Rule

1. 本Registry更新
2. `tools/navigation_sync.py` でDesktop / Mobile Navigationを同期
3. `tools/navigation_audit.py --strict` を実行
4. Navigation Contract Sync Checkで生成差分が0であることを確認
5. PASS後merge

## Current Baseline

2026-08-31 business architecture reviewで、GitHub Pages Official WebをMain HP、STORESをOfficial Shopとする役割分担を確定。
`RS-NAV-2` では旧「メインHP・SHOP」ラベルを `SHOP` へ変更する。

## Automation

- `tools/navigation_sync.py` = Canonical NavigationをPrimary HTMLへ生成・同期
- `tools/navigation_audit.py --strict` = Desktop / Mobileの必須項目欠落・SHOP role driftをFAIL
- `.github/workflows/navigation-sync.yml` = PR上で生成結果との差分を検査
- `.github/workflows/navigation-audit.yml` = PR / mainでstrict auditを実行

## DONE CONDITION

- Primary PagesのDesktop / Mobile NavigationがContractに一致
- STORES表示がSHOPで統一
- Official WebがMain HPとして扱われる
- Footer対象ページも主要Directoryへの導線を保持
- Navigation Audit strict PASS
- Navigation Sync Checkで未コミット差分が0
- 新規Primary PageはRegistry Scopeへ登録
