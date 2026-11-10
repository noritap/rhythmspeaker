# Rhythm Speaker｜クラスカレンダー 日次＋随時更新 運用手順 v1.0

Date: 2026-11-05 JST
Scope: `noritap/rhythmspeaker` → public class JSON → official /schedule/ and RS Wallet.
Status: operational rule; no automatic booking ingestion is claimed.

## 基本方針
- 原則は **毎朝5:00 JSTの定期同期1回**。
- クラス・講師・日時・中止・受付状態などを変更した場合のみ、**作業完了後すぐに手動で公開同期**する。
- Web画面の「更新」ボタンは公開済みJSONを再取得するだけ。**Googleカレンダーからの同期ジョブは起動しない**。
- `workflow_dispatch` は既に許可されているが、チャットの「カレンダー更新」という文章だけで自動起動する仕組みがあるわけではない。実行機能のあるWork/GitHub Actions画面などから実際にジョブを開始し、結果確認が必要。
- 予約確定はLINE・メールでのスタジオからの明示返信による。カレンダー更新＝予約確定ではない。

## 通常の予約・変更時の一連作業
1. スタジオで受講内容を確認し、予約確定の返信を行う。必要なら正式な予約管理記録を更新。
2. 開催日時・講師・中止・OPEN/CLOSEなど**公開予定に影響する変更があれば、Googleカレンダーの正式な対象イベントを編集**。
3. <https://github.com/noritap/rhythmspeaker/actions/workflows/class-calendar-sync.yml> で **Run workflow → main → Run workflow** を実行する。または同等の権限あるGitHub Actions起動操作を使う。
4. `test` と `publish` の **両方がsuccess** であることを確認する。スキップ・失敗は完了ではない。
5. `data/class-sessions.public.json` の `generatedAt` /`lastSuccessfulSyncAt` が実行時刻へ進み、変更したクラス・状態・講師が正しく反映したことを確認。
6. <https://noritap.github.io/rhythmspeaker/schedule/> と <https://tips-app-seven.vercel.app/> を再読み込みし、該当クラスを確認する。
7. 変更が伝播しない場合は別名義や個人カレンダーを編集していないか確認。秘密情報を公開ページやチャットに貼り付けない。

## 自動更新・鮮度と例外
- 公式HPとRS Walletは、認証済みの公開データを30時間以内なら日次運用上の正常な状態として扱う。
- **30時間超**の未同期は通常の更新漏れとして検知する。公式HPでは最新と断定しない。Walletでは古い開催情報からのクラス連動TIPS操作を停止し、通常の手動操作に戻す。
- **48時間超**または同期元の公開状態・データ形式が不正ならWallet APIはエラーとし、古い予定を精算根拠にしない。
- 定期実行はGitHub Actionsのbest effortで遅延・省略され得る。管理者は成功履歴を確認し、必要時に手動実行して復旧する。
- 直前の休講・講師変更・クラス追加は翌朝まで待たずに上記の手順で更新する。

## データ契約上の重要な限界
- 公開クラスJSONの `confirmedBookingCount` は現状 `null`、`bookingCountStatus` は `unknown` のケースがある。
- **予約人数が増えたことだけを理由に手動同期しても、予約台帳がGoogleカレンダーの正式ソースに反映されない限り、予約人数は自動更新されない。** この処理はクラス開催情報の公開同期であり、予約台帳との自動連携ではない。
- カレンダーの `OPEN` は問い合わせを受けられる状態であり空席確約ではない。`CLOSE` は開催中止でなく追加受付なし。
- 公開予定は出席確認やTIPS決済の正本ではない。クラスIDだけで残高を変更しない。
- 手動実行を他者のチャットから安全に自動化するには、権限確認済みの実行経路・監査ログと別の実装・検証が必要。

## Rollback
- この運用契約に変更が必要なら、`class-calendar-sync.yml` と双方の鮮度判定コード・テストを同時にレビューしてPR化する。
- 誤った公開データは、誤った履歴を改変するのでなくGoogleカレンダー正本を修正し、検証済み同期を再実行する。
