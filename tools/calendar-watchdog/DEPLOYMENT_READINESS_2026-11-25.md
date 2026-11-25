# DEV-005 本番設定の下準備 — 検証結果（2026-11-25）

対象：`noritap/rhythmspeaker` の rs-calendar-watchdog（Cloudflare Worker）。
範囲はデプロイ手順の検証と不足項目の洗い出しまで。**本番への有効化はしない。**

前回（2026-11-24）の検証を本日 09:17 JST 時点の main（`cc0ee31`）で再確認した。
watchdog 関連ファイルは 2026-11-24 以降の変更なし（その間の main 更新は予定表データの更新・商店ブログ・商品写真のみ）。

## 検証したこと（2026-11-25 09:17 JST 時点）

| # | 確認内容 | 結果 |
|---|----------|------|
| 1 | オフラインテスト `node --test tools/calendar-watchdog/worker.test.mjs` | 17件全件合格（現行 main のクローンで再実行、Node v24.22.1） |
| 2 | `node --check tools/calendar-watchdog/worker.mjs` | 合格 |
| 3 | `node tools/test_calendar_stale_contract.js` | 合格（3時間超の遅延時は安全なLINE/メール案内へ移行） |
| 4 | デプロイワークフロー `.github/workflows/calendar-watchdog-deploy.yml` と `DEPLOYMENT.md` の照合 | 一致。手動実行のみ、確認文字列 `DEPLOY_RS_CALENDAR_WATCHDOG`、main限定、テスト＋Wrangler契約検証、認証情報なしでは中止、`cloudflare/wrangler-action@v4` |
| 5 | `wrangler.jsonc` の契約検証 | 合格。Worker名 `rs-calendar-watchdog`、入口 `worker.mjs`、`workers_dev: false`（公開URLなし）、Cron `*/15 * * * *`（UTC）、秘密情報なし |
| 6 | 契約ワークフロー `calendar-watchdog-contract.yml` の実行履歴 | 52回実行、最新（2026-11-11）成功（2026-11-24 確認値、本日は再確認できず） |
| 7 | デプロイワークフローの実行履歴 | 0回（未実行。本日、Actions ページで「0 workflow runs / This workflow has no runs yet」を再確認） |
| 8 | 公開JSONの現在値（main・Pages） | ともに `lastSuccessfulSyncAt: 2026-11-25T08:52:15+09:00`、`sourceMode: live`、`dataState: ready` で一致。正常 |
| 9 | Issue #328（G1 進捗管理）の状態 | G1 BLOCKED のまま（最終更新 2026-11-18）。「Cloudflare / GitHub App / 通知Webhook 未接続で本番稼働せず。要本人承認・設定」 |
| 10 | 復旧先ワークフロー `class-calendar-sync.yml` の起動可否 | `workflow_dispatch` あり。watchdog の dispatch 対象として有効。ただし publish ジョブは変数 `RS_CALENDAR_SYNC_ENABLED` と `RS_OPEN_CLASSES_APPROVED` がともに `true` の場合のみ実行される（下記 F 参照） |

## 不足項目・注意点

### A. 90分しきい値と定期同期（1日4回）の間隔が合っていない

- 定期同期 `class-calendar-sync.yml` は1日4回（00:10／05:00／12:00／18:00 JST）。間隔は最大7時間（05:00→12:00）。
- watchdog は公開データが90分を超えて更新されないと復旧同期を dispatch する設計（`worker.mjs` の `staleMs: 90 * 60_000`）。
- そのため稼働後は定期の合間に追加同期が繰り返し走る。例：本日は 08:52 の同期成功後、10:22 頃に90分超え＋60分クールダウン明けで dispatch 対象になる。**これは故障ではなく、しきい値と定期スケジュールの設計の食い違い。**
- 本番有効化の前に方針確認が必要。案：①しきい値を定期の間隔に合わせて見直す（例：7時間超）、②追加同期を許容して頻度が上がることを前提にする。

### B. 本番設定に必要なもの

次のいずれも未設定（Muse からは設定不可・確認不可）。無い場合、デプロイワークフローは認証情報不足で中止する（フェイルセーフは手順書どおり）。

1. Cloudflare アカウントと Worker `rs-calendar-watchdog` のデプロイ権限
2. GitHub Actions シークレット2件：`CLOUDFLARE_API_TOKEN`（Workers 編集のみの限定トークン）、`CLOUDFLARE_ACCOUNT_ID`
3. `noritap/rhythmspeaker` 限定の GitHub App（Actions Read/Write）と Worker シークレット4件：`GH_APP_ID`、`GH_APP_INSTALLATION_ID`、`GH_APP_PKCS8_PRIVATE_KEY`、`ALERT_WEBHOOK_URL`
4. 障害通知 Webhook の受信先の決定と受信確認（G1 の受け入れ条件）

### C. 本番有効化後に残る検証（未実施）

- Cloudflare での Cron 15分ごとの定期実行と実行ログの確認
- 通知の受信確認（テスト用チャンネルで実施し、本番カレンダーや公開JSONを壊さない）
- 制御された復旧試験（重複防止・dispatch・公開反映まで）
- Issue #328 への証拠記録と G1 完了判定

### D. 補足

- 現在の公開JSONは 08:52 時点で、次回定期同期は 12:00 JST。09:17 時点で90分を超えていないため、仮に watchdog が稼働していても dispatch 対象ではない。
- 2026-11-02 時点の Cloudflare 側の既存 Worker は「Hello World」のままだった記録がある（`DEPLOYMENT.md`）。デプロイ時は Worker が意図した監視コードであることを Deployments で確認すること。

### E. デプロイ済みの Cloudflare コードは現行 main と異なる（2026-11-25 追加）

- Issue #328 の記録では、Cloudflare に配置済みの正規コードは version `1d486d8d`（2026-11-02）で、当時の main ソースと一致していた。
- その後、匿名の workflow 読み取りを GitHub App 認証へ変更する PR #332 が main へ統合されたが、Cloudflare へは未リリース。
- つまり現在 Cloudflare にあるコードは、App 認証を含む現行 main の `worker.mjs` より古い。正式デプロイワークフローの実行で上書きされるが、デプロイ後に Deployments でバージョンとソースの一致を確認すること。

### F. 復旧 dispatch が publish まで届くには2つの変数が true であること（2026-11-25 追加）

- `class-calendar-sync.yml` の publish ジョブは `vars.RS_CALENDAR_SYNC_ENABLED == 'true'` かつ `vars.RS_OPEN_CLASSES_APPROVED == 'true'` の場合のみ実行される。
- どちらかが false のまま watchdog が dispatch しても、test ジョブだけが走って publish はスキップされる。watchdog 側は `recovery_dispatched` を記録するため、dispatch 成功と公開更新を混同しないこと。
- 現在は定期同期が公開JSONを更新し続けている（本日 08:52 に更新）ため、2変数は true であると推定される。ただし変数の値そのものは Muse の手段では未確認。有効化前に設定画面で値を直接確認すること。

## 本番有効化の進め方（要確認）

1. 上記 A の方針を決める（しきい値の見直しか、追加同期の許容か）
2. 上記 B の設定を本人が実施する
3. 有効化前に F の2変数が `true` であることを確認する
4. デプロイワークフローを手動実行する（確認文字列を入力）
5. Cloudflare で Worker・Cron・実行ログ・通知受信を確認する（E のソース一致も含む）
6. Issue #328 に証拠を記録して G1 完了判定をする

## 変更履歴

- 2026-11-24：DEV-005 として下準備の検証を実施し、前版レポートを作成。GitHub 書込は承認カードのタイムアウトで未実施。
- 2026-11-25：現行 main（`cc0ee31`）でテストを再実行し全件合格を確認。公開JSONの現在値を更新。E・F を追加。
