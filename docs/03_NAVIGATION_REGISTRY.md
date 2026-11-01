# Rhythm Speaker Web｜NAVIGATION_REGISTRY

Version: 3.0
Status: ACTIVE
Canonical Base URL: https://noritap.github.io/rhythmspeaker/

## Purpose

Rhythm Speaker公式WebのDesktop / Mobile Navigationを1つの正本として管理し、ページ追加時のNavigation Driftを防ぐ。

## Navigation Contract

NAV_VERSION: RS-NAV-3

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
10. オリジナルグッズ — https://rhythmspeaker.stores.jp/?all_items=true

Brand / Home:
- Rhythm Speaker logo → /rhythmspeaker/

Portal exception (PR #284 / #285, consolidated 2026-10-29):
- `/` and `/ecosystem/` header logos return to `/rhythmspeaker/ecosystem/`.
- `/ecosystem/` renders the same 10-link contract once, in a native details menu shared by desktop and mobile. Do not keep a hidden desktop copy to satisfy CI.
- `tools/navigation_sync.py` generates its `portal-site-links` list. `tools/navigation_audit.py` checks one list, exact label/href/order, and absence of both legacy navigation lists.
- The portal keeps the existing trial application CTA; inquiry, booking, payment and Wallet destinations are unchanged.
- The service directory now has ten purpose-based cards: STUDIO / EVENTS / WATCH / MUSIC / LEARN / ORIGINALS / REVIEW / ABOUT / MY PAGE / CONTACT. ORIGINALS is the STORES product-list entry; REVIEW is the separate リズムスピーカー商店 editorial entry. This grouping does not replace the global 10-link RS-NAV-2 contract or the internal business classification below.
- LEARN links only to the existing learning guide; the separate online course remains marked as not yet available. ORIGINALS links to the existing STORES product listing. REVIEW links to the existing Hatena publication. Do not invent or change payment / booking behavior.
- Card primary links use article-bounded expanded hit areas, with independent shortcuts above them. Each purpose group has an h2; each service card has an h3. The top two priority actions are 初回体験 and レッスン日程. The menu opens without JavaScript; Escape dismissal is progressively enhanced.

Primary CTA:
- 初回体験 ¥1,000 / レッスン日程（公式LINEは予約・問い合わせの窓口として維持）

Supporting Surfaces:
- RS Walletは新規客のPrimary CTAにしない
- STORESはRhythm Speakerの**オリジナルグッズ**販売先として扱う。はてなブログの**商品レビュー／リズムスピーカー商店**とは別リンク・別目的にする
- STORESをMain HPとは呼ばない。商品比較記事をSTORESと呼ばない

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
- オリジナルグッズ表記・hrefの不一致
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
`RS-NAV-2` では旧「メインHP・SHOP」ラベルを `オリジナルグッズ` へ変更する。

## Automation

- `tools/navigation_sync.py` = Canonical NavigationをPrimary HTMLへ生成・同期
- `tools/navigation_audit.py --strict` = Desktop / Mobileの必須項目欠落・SHOP role driftをFAIL
- `.github/workflows/navigation-sync.yml` = PR上で生成結果との差分を検査
- `.github/workflows/navigation-audit.yml` = PR / mainでstrict auditを実行

## DONE CONDITION

- Primary PagesのDesktop / Mobile NavigationがContractに一致
- STORES表示がオリジナルグッズで統一
- Official WebがMain HPとして扱われる
- Footer対象ページも主要Directoryへの導線を保持
- Navigation Audit strict PASS
- Navigation Sync Checkで未コミット差分が0
- 新規Primary PageはRegistry Scopeへ登録

## Sites migration review branch (not yet production)
The migration keeps RS-NAV-2's ten destinations and ordering, including RSS/オリジナルグッズ/workshops. The compact Sites header exposes schedule/pricing/instructors as additional STUDIO entry points. Shared desktop/mobile menu lists retain the canonical generated contract. `/ecosystem/` keeps one canonical portal list and a no-JavaScript navigation fallback. Logos on migrated studio pages consistently return to the service portal; brand-name text returns to the studio home. New schedule/pricing routes are review-only pending owner approval; no main routing changes are adopted by this document alone.

## v2 Canonical UX Rule

- **docs/ux/RS_WEB_UX_RULES_V2.md** is the canonical UX wording, customer booking semantics and menu visual priority specification.
- Top two purpose-driven actions on `/ecosystem/`: 初回体験 ¥1,000 and レッスン日程. `/schedule/` stays the same URL.
- Global STORES link is labeled `オリジナルグッズ` and points to the product listing. Editorial shop is the separate `商品レビュー` category and is **not** a direct e-commerce checkout.
- Preserve 10 global destinations/order and 10 purpose-based service cards; do not change operational workshop/Wallet/Calendar behavior.

## RS-NAV-3｜優先順位別共通メニュー（2026-11-01）

RS-NAV-2の元の10行き先を削除しない。ただし、右上メニューの情報設計は利用者の目的・訪問頻度と収益上の優先順位に応じて組み替えた。

1. 最優先: `/schedule/`「レッスン日程」 / `/trial/`「初回体験 ¥1,000」
2. 教室・レッスン: `/pricing/`, `/classes/`, `/instructors/`, `/workshops/`, `/access/`, `/rental/`
3. 会員・お問い合わせ: RS Wallet / スタジオ公式LINE
4. その他: 教室トップ、教室紹介、FAQ、RSS、オリジナルグッズ、すべてのサービス

現在のページへの自己リンクは省く。メニューをPC/モバイルで複製せず、単一の `nav.rs-menu-nav` を使用する。

**生成正本**: `tools/navigation_sync.py` の `MENU_GROUPS` と `PAGES`。主要10ページが対象。
**監査**: `tools/navigation_audit.py --strict` は全対象ページの正確な構造・行き先・順序を検証する。
**UI**: 開閉表示・Escapeフォーカス復帰・画面高さ内のスクロール・2列カード・大きな行動CTA。
**UX指針**: `docs/ux/RS_WEB_UX_RULES_V2.md` v2.1。

これまでのRS-NAV-2の表示順に関する記述は履歴であり、新メニューの順序はこの章を優先する。
