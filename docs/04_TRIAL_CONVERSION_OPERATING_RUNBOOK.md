# Trial Conversion Operating Runbook

Status: ACTIVE OPERATING BASELINE
Scope: Rhythm Speaker Official Web → Official LINE → 初回体験

## 1. Purpose

体験予約導線の改善を、見た目やCTA変更回数ではなく、実測したConversion Funnelで判断する。

このRunbookは以下を運用単位とする。

Web page view
→ LINE CTA click
→ LINE inquiry
→ Trial booking
→ Trial visit

## 2. Current Gate

Current known state:

- `/trial/` のスマホLINE prefillは実機確認済み。
- 体験予約系prefill URLは主要ページへ展開済み。
- 主要ページの体験予約CTA URL driftは `tools/trial_cta_audit.py` で検査する。
- baseline CSVは `data/trial_conversion_baseline.csv` を使用する。
- GA4 Property / Measurement IDは未確認のため、推測値でtracking codeを導入しない。

したがって、現段階のNext Gateは「新しいCTAを増やす」ではなく、観測値を蓄積できる状態を維持すること。

## 3. CTA Contract

体験予約・体験日時相談・navigation上の体験CTAは、スマホ実機でprefill確認済みのcanonical LINE URLを使用する。

一般相談、RSS参加等の別目的LINE導線は、体験予約Conversionへ混ぜない。

PR時は以下が自動確認される。

```bash
python tools/trial_cta_audit.py --strict
```

PASSしない場合、体験予約CTAのURL driftを修正してからmergeする。

## 4. Aggregate Data Only

Repositoryへ保存するのは日別・ページ別の集計値だけとする。

CSV columns:

```text
date,page_path,page_views,line_cta_clicks,line_inquiries,trial_bookings,trial_visits,notes
```

保存禁止:

- 氏名
- LINE表示名
- 電話番号
- メールアドレス
- メッセージ本文
- その他の個人識別情報

`tools/trial_conversion_report.py` は既知のPII列名を拒否し、集計値からKPIを計算する。

## 5. Daily / Weekly Operation

観測値が取れるSourceが確定した後、日別または週次で集計値をCSVへ追加する。

その後、以下を実行する。

```bash
python tools/trial_conversion_report.py
```

出力するKPI:

- LINE CTR = LINE CTA clicks / page views
- Inquiry rate = LINE inquiries / LINE CTA clicks
- Booking rate = trial bookings / LINE inquiries
- Visit rate = trial visits / trial bookings
- Visit conversion = trial visits / page views

全体値に加え、`page_path` ごとの値も確認する。

## 6. Minimum Evidence Window

初回判断は最低7日、可能なら30日を基本とする。

1〜2件の短期反応だけでCTA文言・ページ構造を大きく変えない。

## 7. Decision Routing

### Page view → LINE click が弱い

確認対象:

- Heroで価値が伝わっているか
- 初心者不安が解消されているか
- CTA位置・文言が理解しやすいか
- MobileでCTAが押しやすいか

### LINE click → Inquiry が弱い

確認対象:

- LINE prefillがスマホで維持されているか
- LINE遷移後の入力摩擦
- 体験前に登録必須と誤認させていないか

### Inquiry → Booking が弱い

確認対象:

- 日程提示
- 返信速度
- 予約確定までの案内
- 初回利用条件の説明

### Booking → Visit が弱い

確認対象:

- 来店前リマインド
- 場所・持ち物・15分前来店案内
- キャンセル要因

## 8. Analytics Implementation Gate

GA4等を導入する場合は、以下を満たしてからProductionへ入れる。

1. Analytics serviceを確定する。
2. 正式なProperty / Measurement IDを確認する。
3. Cookie / Privacy影響を確認する。
4. `line_cta_click` event仕様を確定する。
5. Debug / Realtimeで取得を確認する。
6. 主要ページへ展開する。

Measurement IDを推測しない。

## 9. Release Checks

Conversion関連変更では最低限以下を確認する。

```bash
python tools/navigation_audit.py --strict
python tools/trial_cta_audit.py --strict
python tools/trial_conversion_report.py
```

GitHub Actions PASSだけでスマホLINEアプリの実動作を断定しない。LINE URL scheme変更やCTA変更を行った場合は、必要に応じてスマホ実機確認を別途行う。

## 10. Current Decision

Until measured evidence exists:

- KEEP current verified trial LINE prefill.
- PROTECT it with automated drift detection.
- COLLECT aggregate conversion evidence.
- DO NOT repeatedly rewrite CTA copy based only on assumption.

観測値が蓄積されたら、最も大きいFunnel dropを次のVersion Upgrade対象とする。
