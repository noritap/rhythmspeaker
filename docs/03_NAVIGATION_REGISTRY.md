# Rhythm Speaker Web｜NAVIGATION_REGISTRY

Version: 1.0
Status: ACTIVE
Canonical Base URL: https://noritap.github.io/rhythmspeaker/

## Purpose

Rhythm Speaker公式WebのDesktop / Mobile Navigationを1つの正本として管理し、ページ追加時のNavigation Driftを防ぐ。

## Navigation Contract

NAV_VERSION: RS-NAV-1

Order:
1. 教室トップ — /rhythmspeaker/
2. 初回体験 — /rhythmspeaker/trial/
3. クラス — /rhythmspeaker/classes/
4. 教室紹介 — /rhythmspeaker/about/
5. サービス一覧 — /rhythmspeaker/ecosystem/
6. FAQ — /rhythmspeaker/faq/
7. アクセス — /rhythmspeaker/access/
8. RSS — /rhythmspeaker/rss/
9. メインHP・SHOP — https://rhythmspeaker.stores.jp/

Brand / Home:
- Rhythm Speaker logo → /rhythmspeaker/

Primary CTA:
- 初回体験 / Official LINE

Supporting Surfaces:
- RS Walletは新規客のPrimary CTAにしない
- STORESは外部SHOP導線として維持

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

## Relation to Previous Decision

`docs/02_NAVIGATION_ROLE_DECISION.md` の基本原則（ロゴ=教室トップ、LINE=Primary CTA、STORES=外部SHOP）は継承する。
本Registryが現在のGlobal Navigation項目・順序のCanonical Sourceとする。

## Drift Definition

以下はNavigation Drift:
- サービス一覧が一部ページだけに存在
- RSSが一部ページだけに存在
- DesktopとMobileの項目差
- SHOP表記・hrefの不一致
- 項目順の不一致
- Parent / Home導線欠落

## Change Rule

1. 本Registry更新
2. Desktop / Mobile / Footer対象を同期
3. Navigation Audit
4. strict PASS後merge

## Current Baseline

2026-08-30 auditで、About / Ecosystemは新構造へ進んでいる一方、Trial / Classes / FAQ / Access / RSS / Topに未同期項目があることを確認。Baseline remediation完了までは Drift Known 状態。

## DONE CONDITION

- Primary PagesのDesktop / Mobile NavigationがContractに一致
- Footer対象ページも主要Directoryへの導線を保持
- Navigation Audit strict PASS
- 新規Primary PageはRegistry Scopeへ登録
