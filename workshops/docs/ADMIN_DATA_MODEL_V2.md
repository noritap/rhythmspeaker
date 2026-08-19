# Rhythm Speaker Workshop Manager — Admin Data Model v2

## Goal

管理者がスマートフォンだけで公開ページに必要な情報・画像・予約条件を登録し、共通テンプレートからページを生成できるイベントCMSモデルを定義する。

## Event fields

### Core
- `title` イベント名
- `subtitle` サブコピー
- `slug` 公開URL識別子
- `instructor` 講師名
- `date` 開催日
- `venue` 会場名
- `address` 住所
- `accessNote` アクセス補足
- `mapUrl` 地図URL
- `summary` 一覧用短文
- `description` 詳細説明
- `status` draft / published / archived

### Media
- `coverImage` 一覧カード
- `heroImage` 詳細ヒーロー
- `flyerImage` フライヤー原本
- `instructorImage` 講師写真
- `ogImage` SNS共有
- `galleryImages[]` その他写真

画像を1枚だけ登録した場合は、`heroImage -> coverImage -> flyerImage` の順でフォールバックし、同じ素材をCSSクロップして再利用できる。

### Content blocks
- `learningPoints[]` 学べること
- `targetAudience[]` おすすめ対象
- `bringItems[]` 持ち物
- `instructorBio` 講師プロフィール
- `instructorMessage` 講師メッセージ
- `cancellationPolicy` キャンセル規定
- `paymentNote` 支払い案内
- `faqs[]` `{ question, answer }`

## Session fields

- `name`
- `start`
- `end`
- `minutes`
- `price`
- `capacity`
- `level`
- `paymentUrl`
- `consumes[]` セット商品が同時消費するクラスID
- `featured` 強調表示
- `active`
- `sortOrder`

## Reservation fields

- `id`
- `eventId`
- `sessionId`
- `name`
- `email`
- `phone`
- `experience`
- `shoes`
- `shoeSize`
- `note`
- `amount`
- `paymentStatus`
- `status`
- `checkin`
- `createdAt`

## Admin editor order — smartphone first

1. 基本情報
2. 公開状態
3. メイン画像
4. クラス・料金・定員
5. 紹介文 / 学べること / 対象者
6. 講師
7. 会場 / アクセス
8. 持ち物 / FAQ / キャンセル規定
9. 支払い案内
10. 保存・公開

## UX rules for admin

- 項目名は日本語中心
- 画像ごとに用途説明を表示
- 1枚だけでも公開可能
- 詳細項目は折りたたみ可能にする
- 既存イベント複製で入力負荷を削減
- クラスは並び順を保持
- 公開前に必須項目だけ検証
- liveでは管理者Auth必須

## Database v2 migration direction

`workshop_events` に以下を追加する。

- subtitle text
- cover_image text
- hero_image text
- flyer_image text
- instructor_image text
- og_image text
- gallery_images jsonb
- access_note text
- map_url text
- learning_points jsonb
- target_audience jsonb
- bring_items jsonb
- instructor_bio text
- instructor_message text
- cancellation_policy text
- faqs jsonb

既存 `cover` は互換期間を設け、`cover_image` へ移行する。
