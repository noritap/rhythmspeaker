# Rhythm Speaker Workshop OS — Rebuild Spec v1

## 1. Purpose
Rhythm Speakerで開催するすべてのワークショップを、参加者には「迷わず内容を理解して予約できる」、運営者には「スマホだけで作成・公開・予約管理できる」共通OSとして提供する。

## 2. Non-negotiable rules
1. フライヤーは原本の構図を尊重し、公開詳細ページでは1枚の画像として表示する。
2. 分割表示・タイル再構成・上からの装飾合成を行わない。
3. 一覧は「探す」、詳細は「理解する」、予約は「申し込む」、管理は「運営する」に目的を分離する。
4. スマホを主基準とし、PCはその拡張レイアウトとして設計する。
5. CTAは常に次の行動を1つだけ明確にする。
6. 画像内の文字だけに依存せず、日時・会場・料金・残席・予約導線はHTMLでも提供する。

## 3. Public information architecture
### Workshop list
- 開催予定見出し
- 1イベント = 1カード
- フライヤー原本比率サムネイル
- 受付状態
- 開催日
- タイトル
- 会場 / 講師
- 料金概要
- 詳細・予約CTA

### Workshop detail
1. フライヤー原本
2. 日付 / タイトル / 概要
3. 講師 / 会場
4. 主CTA「クラスを選ぶ」
5. 予約フロー表示
6. クラスカード
7. 予約フォーム
8. 会場 / 持ち物
9. フライヤー拡大

## 4. Reservation UX
### Step 1: class selection
各クラスカードに「このクラスを選ぶ」を配置。選択すると予約フォームへスクロールし、参加クラス・料金・残席を自動表示する。

### Step 2: participant input
必須項目は最小限にする。
- 氏名
- 電話番号
- メール
- タップ経験
- シューズ持参 / レンタル
- レンタル時のみサイズ
- 備考
- 参加条件同意

### Step 3: completion
- 予約番号
- 選択クラス
- 金額
- 支払い方法
を1画面で提示する。

## 5. Admin UX
- ダッシュボード
- 新規イベント
- イベント編集
- クラス追加 / 料金 / 定員
- フライヤーアップロード
- 公開 / 下書き
- 予約一覧
- 入金状態
- チェックイン

## 6. Image policy
### Current demo
NAOYUKIフライヤーは元JPEGを変更せず、ブラウザ上では単一の`<img>`として表示する。配信上の制約により元JPEGのBase64データを分割保存する場合でも、表示時には1つのJPEG Blobとして復元し、視覚的な分割・加工は行わない。

### Production
Supabase Storage等の本番ストレージへ原本ファイルを1ファイルとして保存し、公開ページ / 一覧 / OGPのソースにする。

## 7. Design system
- Background: warm off-white
- Surface: white
- Primary text: near-black
- Accent: restrained gold
- Status: green / red only where semantic
- Rounded cards, ample spacing, no decorative clutter
- Strong hierarchy: image → event facts → class → reservation

## 8. Definition of done
- フライヤーが全体表示される
- 画像に壊れ・灰色領域・別画像混入がない
- スマホで3タップ以内にクラス選択へ到達できる
- クラス選択後、フォームの選択状態・料金・残席が一致する
- 一覧と詳細で情報が矛盾しない
- 公開ページに運営都合の複雑さを露出しない
