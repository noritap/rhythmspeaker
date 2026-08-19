# Rhythm Speaker Web — Conversion Measurement Baseline v1

Status: IMPLEMENTATION BASELINE
Scope: 新規顧客Web → Official LINE → 初回体験

## 1. Purpose

Rhythm Speaker Webの改善を、CTA追加や見た目の変更回数ではなく、初回体験につながる実測値で判断できる状態を作る。

このv1では、まず以下のファネルを分離して測る。

Web page view
→ LINE CTA click
→ LINE inquiry
→ Trial booking
→ Trial visit

## 2. Primary KPI

- LINE CTR = LINE CTA clicks / page views
- Inquiry rate = LINE inquiries / LINE CTA clicks
- Booking rate = trial bookings / LINE inquiries
- Visit rate = trial visits / trial bookings
- Visit conversion = trial visits / page views

最重要成果はクリック数ではなく、最終的な「初回体験の実来店数」とする。

## 3. Web Event Specification

GA4等のWeb計測を導入する場合、体験予約系LINE CTAは次のイベントへ統一する。

Event name:
`line_cta_click`

Required parameters:
- `page_path`
- `cta_location`
- `cta_label`

Recommended `cta_location` values:
- `nav`
- `hero`
- `body`
- `final`
- `floating`

例:

```text
event: line_cta_click
page_path: /trial/
cta_location: hero
cta_label: LINEで初回体験を予約する
```

## 4. Funnel Definitions

### Page view
対象ページが閲覧された回数。Web AnalyticsをSource of Truthとする。

### LINE CTA click
Rhythm Speaker Web上の体験予約・体験相談CTAからOfficial LINEへ遷移した回数。

一般用途のLINE相談（例: クラス相談、RSS参加相談）は、体験予約Conversionへ混ぜない。

### LINE inquiry
初回体験に関するユーザーからの有効な問い合わせ。

### Trial booking
日時が確定した初回体験予約。

### Trial visit
予約者が実際に来店して初回体験を実施した件数。

## 5. Baseline Window

最初の判断は最低7日、可能なら30日で行う。

短期の1〜2件だけでCTA文言やページ構造を大きく変えない。

## 6. Data Safety

このRepositoryに以下を保存しない。

- 氏名
- LINE表示名
- 電話番号
- メールアドレス
- メッセージ本文
- その他の個人識別情報

Repositoryへ残すbaselineは日別・ページ別の集計値のみとする。

## 7. Current Known State

- `/trial/` のLINE prefillはスマホ実機でPASS済み。
- 体験予約系prefill URLは主要ページへ展開済み。
- GA4 Property / Measurement ID: UNKNOWN
- Repository内のGA4 / `gtag` / `dataLayer` / `line_cta_click` 実装: 未確認（2026-08-19 review時点で検索結果なし）

Measurement IDを推測して実装しない。

## 8. Implementation Gate

Web event trackingをProductionへ入れる前に、次を確認する。

1. 使用するAnalytics serviceを確定する。
2. 正式なMeasurement ID / Propertyを確認する。
3. Cookie・Privacyへの影響を確認する。
4. `line_cta_click` がDebug/Realtimeで取得できることを確認する。
5. 取得確認後に全ページへ展開する。

## 9. Decision Rule

改善の優先順位は、ファネルの最も大きな落ち込みから決める。

- Page view → LINE click が弱い: CTA・理解・不安解消を改善
- LINE click → Inquiry が弱い: prefill・LINE到達後の摩擦を確認
- Inquiry → Booking が弱い: 予約案内・日程提示を改善
- Booking → Visit が弱い: リマインド・来店不安を改善

計測できない状態で、CTAを連続変更しない。
