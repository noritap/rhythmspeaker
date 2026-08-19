# Rhythm Speaker Workshop Manager

Rhythm Speakerの全ワークショップをスマートフォンから作成・公開・予約・支払い状態管理・当日受付できる共通Web OS。

## URL構成

- `/workshops/` 公開イベント一覧
- `/workshops/event.html?slug=...` イベント詳細・予約
- `/workshops/admin/` スマホ管理画面

## 管理機能

- イベント新規作成 / 編集 / 複製
- フライヤー・写真アップロード
- 公開 / 下書き
- 講師・日時・場所・説明
- クラスを任意数追加
- 料金 / 定員 / レベル / 時間
- セット商品の席連動
- Stripe / STORES等の外部決済URLをクラス単位で登録
- 予約一覧
- 入金済 / 未入金
- 当日チェックイン
- キャンセル
- 売上見込 / 入金済集計

## 現在のモード

`config.js` は `demo`。

デモモードではブラウザ localStorage を使用し、スマホUI・作成フローを確認できる。データは端末間共有されない。

Supabaseプロジェクト作成後、`config.js` にURLとPublishable Keyを設定し `mode: "live"` に変更すると、オンライン共有DBへ切り替える設計。

## Supabase

`supabase/001_workshop_manager.sql` を新規専用Supabaseプロジェクトへ適用する。

設計上、既存の kashima-house-os データベースとは混在させない。

### セキュリティ

- 公開ユーザーは公開イベント / クラスのみ閲覧可能
- 予約者一覧は管理者だけ閲覧可能
- 公開予約は直接INSERTせず、`create_workshop_reservation` RPC経由
- RPC内で対象セッションをロックして定員超過を防止
- 管理権限はSupabase Authのメールと `workshop_admin_emails` の一致で判定
- 画像Storageの書込 / 更新 / 削除は管理者だけ

## 決済 v1

v1は各クラスに外部決済URLを設定できる方式。
予約後にStripe Payment Link / STORES等へ送客し、管理画面で入金状態を管理する。

次段階でStripe Checkout + WebhookをSupabase Edge Functionへ統合し、決済成功時の自動入金反映を実装する。
