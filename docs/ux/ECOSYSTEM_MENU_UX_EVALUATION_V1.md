# RHYTHM SPEAKER｜全サービスメニュー v1.0 UX評価

Date: 2026-11-01
Review status: **Baseline 90/100 preliminary before v2 naming integration**
Pull request: https://github.com/noritap/rhythmspeaker/pull/314
Browser QA: https://github.com/noritap/rhythmspeaker/actions/runs/41262259833
Screenshots in GitHub Actions artifact `ux-pr220-evidence`: `ecosystem-390.png`, `ecosystem-1440.png`

## Executive assessment

**90 / 100 (暫定合格 / 本番統合前のレビュー可)**

| Criteria | Score | Evidence and limits |
|---|---:|---|
| 名称の分かりやすさ | 18/20 | 「レッスン日程」、初回体験、オリジナルグッズと商品レビューの役割は明瞭。旧グローバルナビの「SHOP」が残るため満点ではない |
| 優先順位・視覚的階層 | 19/20 | 初回体験・レッスン日程を最上部の大きな2カードに設置。重要度の低いカードは中/小に変更 |
| カテゴリと買い物導線 | 18/20 | STUDIO / EVENTS、WATCH / MUSIC / LEARN、ORIGINALS / REVIEW、ABOUT / WALLET / CONTACT。買うと読むが別リンク。ただし商品の実購入率は未測定 |
| 操作・リンク整合性 | 18/20 | 10カード、P0、外部2リンクを自動テスト。外部サービス内部での購入/投稿は行っていない |
| スマホ・アクセシビリティ | 17/20 | 320/375/390/430/768/1440pxの自動ブラウザ回帰で横スクロールと表示エラーなし。390pxは情報量が多く、縦スクロール長は引き続き改善余地 |
| **TOTAL** | **90/100** | ユーザー実測ではなく、ソース＋ブラウザ自動操作＋画像目視によるレビュー |

## What changed

- ヘッダー・共通メニュー・フッターの「通常クラス予約」を主要10ページで「レッスン日程」に統一。
- 全サービス冒頭に「初回体験 ¥1,000」「レッスン日程」の2大CTAを配置。
- 「通常のことは説明しない／例外を明示／重要な手続きは操作時に伝える」に沿って重複リンクと装飾的な番号を削減。
- STORESの商品一覧は「オリジナルグッズ」、商店ブログは「商品レビュー」として分割し、購入と記事閲覧を混同させない。
- 所有商品の幅を少し大きく（PCで1.35:0.85）、記事メディアは一段控えめに。
- 重要な元のサービスルートは全て維持し、RS Walletや公式LINEも残す。

## Verified

- 9 CI checks including UI browser, static site, navigation, copy, conversion baseline audits: PASS on the last tested implementation commit.
- Browser-tested 10 studio routes × 6 widths, plus all service menu cards × 6 widths.
- Test preserves all ten service card destinations and verifies P0 above other category cards.
- UI screenshots `ecosystem-390.png` and `ecosystem-1440.png` saved in workflow artifact.
- No payment, authentication, workshop reservations, Google Calendar, or live user records were modified.
- Code and HTML are in Draft PR; main and public GitHub Pages remain on the prior release.

## Residual issues and follow-up VC

1. **Global storefront naming**: v2 integrates 「オリジナルグッズ」 into the universal menu and source contract, subject to full regression validation before release.
2. **Mobile length**: all ten service cards remain browsable; on 390px the page is vertically long. Before optimizing with progressive disclosure, obtain simple user task completion observations (初回体験／日程／音楽／商品レビュー).
3. **External storefront catalog**: STORES listing `?all_items=true` is derived from the current storefront item menu. Monitor if the product listing path ever changes.
4. **Business outcomes**: higher CTA salience is a design hypothesis. Confirm page clickthrough and LINE inquiries after any release; do not equate automated QA with a measured conversion uplift.
5. **Real-device validation**: automated Playwright viewport is not physical iOS/Android. Add final manual taps when operationally available.

## Decision

**Review-ready; safe to discuss next release.** No automatic merge to main under this task because the request was to construct and evaluate the design. Explicit publication request or reviewed acceptance can trigger release gate.
