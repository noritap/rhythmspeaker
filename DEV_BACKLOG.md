# DEV_BACKLOG — 自律開発バックログ

Muse の日次開発タスク（dev-daily-ops、毎朝08:30ごろ）が参照する改善リスト。正本はこのファイル。

## 運用ルール

- 1日1件、「状態：未着手」の一番上の項目から着手する。
- 手順：実装 → テスト（既存テストがある場合は全件実行）→ PR作成 → マージ。
- マージは常時ルール（2026-11-21、ノリさん指示）に従う：収益が減る・支出が発生する・問題が起きる恐れがある場合のみ事前確認。それ以外は確認なしでマージしてよい。
- 対象外：本番の振る舞いを大きく変える変更、課金・権限拡大・データ削除を伴うもの。これらは着手せず「要確認」に状態を変えて報告する。
- 完了したら状態を「完了（PR番号またはマージ日）」に更新する。着手して止まった場合は、理由を状態欄に書く。

## 項目

### DEV-001 診断PR #553のマージ
- 対象：noritap/rhythmspeaker PR #553（calendar-sync のエラーメッセージに対象日時と種別だけを追加。fail-closed の挙動は不変、回帰テスト追加、ローカル17件合格済み）
- リスク：低（診断情報の追加のみ）
- 状態：完了（2026-11-21 マージ済み、merge commit 6c957906）

### DEV-002 PR #559のレビューとマージ
- 対象：noritap/rhythmspeaker PR #559（Shokz／Anker 公式写真＋フォールバック表示）
- 内容：差分と生成カタログへの影響を確認し、商店の本番表示が壊れないことを検証してからマージする
- リスク：低〜中（本番表示に触れるため検証必須）
- 状態：完了（2026-11-21 PR #559 マージ済み、merge commit ec5e68b）
- 実施内容：PR #559 をレビューし、main との競合を解消してマージ。Shokz／Anker の公式写真を RS-P0013／RS-P0016 に設定し、AIイラストをギャラリー第2画像として維持。画像失敗時の自動フォールバックは #560 で既に main に入っていたため PR 側の重複実装は main 版を採用。Codex 指摘のサムネイル切替時のキャプションずれも修正（AIイラスト選択時に「AI制作イメージ」と表示）。検証：マージ後の main でテスト17件合格、バリデーターOK、カタログ21件維持。

### DEV-003 上流PR #29のID衝突解消の下準備
- 対象：noritap/AMAZON_COMMERCE_DATA_OS PR #29（RS-P0027 のID衝突。main側の RS-P0027 は NYANDELMO シューズカバーで公開済み。PR側の EcoFlow RIVER 3 Plus を次の空きIDへ付け替える）
- 内容：付け替え案と影響範囲の整理まで。台帳の変更とマージは要確認に回す
- リスク：中（台帳データに触れる）
- 状態：完了（下準備完了 2026-11-22。付け替え案：RIVER 3 Plus → RS-P0053／リンク RS-L0053、画像参照 rs-p0053-…。提案は上流PR #29 のコメントに記載。台帳の付け替えとマージは要確認）
- 実施内容：最新main（商品48件）・全オープンPR・候補バッチ（discovery_queue.json）を再照合。欠番 RS-P0008〜P0011 は PR #9 が主張中のため不使用。ブランチは2026-11-15時点のbaseで商品23件しかなく、現状のまま統合すると main の後発変更（ASIN登録・公開化・NYANDELMO登録）が消えるためリベース必須と確認。画像ファイル rs-p0027-river3-plus-guide.svg は rhythmspeaker main に未存在のため要確認。

### DEV-004 音楽台帳のJSONスキーマ検証スクリプト
- 対象：noritap/RHYTHM_SPEAKER_MUSIC_OS
- 内容：catalog 配下の台帳JSONに対するスキーマ検証スクリプトを追加し、既存台帳で合格することを確認する（追加のみ、既存ファイルは変更しない）
- リスク：低
- 状態：完了（2026-11-23 PR #33 マージ済み、merge commit 6820d959）
- 実施内容：scripts/validate_catalog_json.py を追加。マニフェスト（12曲）・ソース台帳（24行）・テイク登録（24件）の型・形式・相互参照を検証し、既存台帳で合格。壊したコピーでの陰性テスト9件も検出を確認。リポジトリ内に既存テスト・CIなし。

### DEV-005 rs-calendar-watchdog の本番設定の下準備
- 対象：noritap/rhythmspeaker tools/calendar-watchdog/
- 内容：デプロイ手順の検証と不足項目の洗い出しまで。本番への有効化は要確認に回す
- リスク：低（準備のみ）
- 状態：完了（下準備完了 2026-11-25。検証レポート PR #605 マージ済み、merge commit 6164cb61）
- 実施内容：現行 main（cc0ee31）でオフラインテストを再実行し全件合格（worker.test.mjs 17件、`node --check`、stale contract）。デプロイワークフローと DEPLOYMENT.md の照合、wrangler.jsonc の契約検証（Worker名・入口・workers_dev:false・Cron */15・秘密情報なし）も合格。公開JSONは main・Pages とも 2026-11-25T08:52:15+09:00 で一致し正常。デプロイワークフローは未実行（0 runs）。新規の注意点として、E. デプロイ済み Cloudflare コードは PR #332（App 認証）より古いこと、F. 復旧 dispatch が publish まで届くには RS_CALENDAR_SYNC_ENABLED と RS_OPEN_CLASSES_APPROVED がともに true であることを記録。90分しきい値と定期同期（1日4回）の間隔の食い違い、GitHub App・Worker Secrets・通知 Webhook の未設定は引き続き要確認。Issue #328 は G1 BLOCKED のまま。

### DEV-006 商店特集（features）のスキーマ検証追加
- 対象：noritap/AMAZON_COMMERCE_DATA_OS（data/features.json と schemas/）
- 内容：features.json のJSONスキーマを追加し、check_schemas.py で検証が通ることを確認する（追加のみ。生成器は特集対応済みで、スキーマが無くても動作に影響しない）
- リスク：低
- 状態：未着手
