# Rhythm Speaker Workshop Manager

Rhythm Speakerの全ワークショップをスマートフォンから作成・公開・予約・支払い状態管理・当日受付できる共通Web OS。

## Status / Boundary

Current Status:
`LIVE SUPABASE RUNTIME / ISOLATED WORKSHOP SUBTREE`

この`/workshops/` subtreeは、Rhythm Speaker Official Web本体と同一Repositoryに存在するが、Official WebのPrimary LINE体験予約Funnelとは分離して扱う。

Current verified runtime:

- `config.js` の `mode` は `live`
- Workshop専用Supabase URL / Publishable Keyを使用
- `workshop-media` Storage bucketを使用
- Supabase Authを管理画面で使用
- Workshop event / session / reservation dataをSupabaseで共有
- `/workshops/instructor/` にtoken-gated read-only instructor viewあり
- Stripe Checkout / Webhookによる自動入金反映は未導入
- Service Role Key / SecretsをRepositoryへ保存しない

Publishable Keyはブラウザ利用を前提とする公開クライアントキーであり、AuthorizationはRLS / RPC / Authで担保する。Service Role Key等のSecretsとは分離する。

本番予約者情報を扱うため、以後の変更では以下をHigh-Risk Gateとして扱う。

- RLS / Authorization変更
- Auth / 管理者権限変更
- reservation schema変更
- 個人情報の取得項目追加
- Payment自動化
- destructive migration / delete
- Service Role Key / Secret取扱い

Canonical boundaryは `/PROJECT_PROFILE.md` を参照する。PROJECT_PROFILEとruntimeが競合する場合はGitHub mainの実装をCurrent Realityとして確認し、Profile driftを解消する。

## URL構成

- `/workshops/` 公開イベント一覧
- `/workshops/event.html?slug=...` イベント詳細・予約
- `/workshops/admin/` スマホ管理画面
- `/workshops/instructor/?token=...` 講師向けread-only確認画面

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
- 講師専用共有URL発行 / 再発行
- 講師向けクラス定員・予約・売上・参加者確認

## Current live architecture

`config.js` は `live`。

ブラウザUIはSupabase clientを使用してオンライン共有DBへ接続する。公開画面と管理画面で同じWorkshop data sourceを参照する。

live runtimeをOfficial Web本体の標準機能へ拡張しない。Workshopは独立した価値ストリームとして管理し、Primary LINE CTAや初心者向け教室Funnelを壊さない。

## Supabase

Workshop専用Supabase projectを使用する。

設計上、既存の他Project databaseとは混在させない。

### セキュリティ

- 公開ユーザーは公開イベント / クラスのみ閲覧可能
- 予約者一覧は管理者だけ閲覧可能
- 公開予約はRPC経由で処理
- RPC内で定員整合性を保つ
- 管理権限はSupabase Auth / database policyで制御
- 画像Storageのwrite操作は管理者権限で制御
- 講師viewはevent単位tokenでread-only共有
- token再発行で旧講師URLを無効化可能
- Service Role Key / SecretsをRepositoryへ保存しない

## 決済 v1

各クラスに外部決済URLを設定できる方式。
予約後にStripe Payment Link / STORES等へ送客し、管理画面で入金状態を管理する。

Stripe Checkout + WebhookをSupabase Edge Functionへ統合し、決済成功時の自動入金反映を行う案はFuture Scope。
本番導入前に別途Security / Privacy / Payment Reviewを行う。
