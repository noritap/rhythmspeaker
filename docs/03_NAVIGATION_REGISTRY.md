# Rhythm Speaker Web｜NAVIGATION_REGISTRY

Version: 1.3
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
5. ワークショップ — /rhythmspeaker/workshops/
6. サービス一覧 — /rhythmspeaker/ecosystem/
7. FAQ — /rhythmspeaker/faq/
8. アクセス — /rhythmspeaker/access/
9. RSS — /rhythmspeaker/rss/
10. SHOP — https://rhythmspeaker.stores.jp/

Brand / Home:
- Rhythm Speaker logo → /rhythmspeaker/

Portal exception (PR #284 / #285, consolidated 2026-10-29):
- `/` and `/ecosystem/` header logos return to `/rhythmspeaker/ecosystem/`.
- `/ecosystem/` renders the same 10-link contract once, in a native details menu shared by desktop and mobile. Do not keep a hidden desktop copy to satisfy CI.
- `tools/navigation_sync.py` generates its `portal-site-links` list. `tools/navigation_audit.py` checks one list, exact label/href/order, and absence of both legacy navigation lists.
- The portal keeps the existing trial application CTA; inquiry, booking, payment and Wallet destinations are unchanged.
- The nine directory cards are STUDIO / BROADCAST / MUSIC / EVENTS / ONLINE / SHOP / OWNER / MY PAGE / CONTACT. This directory taxonomy does not replace the global 10-link contract or the internal business classification below.
- ONLINE and the dedicated SHOP site remain non-clickable pending entries; their verified supporting links remain available (maximum three per card). Never guess their primary URLs.
- Card primary links use article-bounded expanded hit areas, with independent shortcuts above them. Every category has an h2. The menu opens without JavaScript; Escape dismissal is progressively enhanced.

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
