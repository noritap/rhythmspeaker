# Rhythm Speaker Schedule v2 — 独立試験環境

本プロジェクトは既存の \`/schedule/\` と GitHub \`main\` を変更せず、新しい検索/申込UXを並行試験するものです。

## 試験段階
- 独立Vercelプロジェクト: \`rhythmspeaker-schedule-v2-lab\`
- \`/api/classes?mode=public\`: GitHub Pagesで**既に一般公開済み**のJSONを読み取り、公開項目だけ表示。Google Calendar API直接取得ではない。
- \`/api/classes?mode=demo\`: 架空のクラス予定。コピーまで動作し、予約の送信はしない。
- 公開データが3時間以上古いときは必ず遅延警告。実予約への直接申込は仮ページで有効化しない。
- 本番は \`https://noritap.github.io/rhythmspeaker/schedule/\` のまま。

## 次のゲート
1. 事業者承認の元、**別環境の**読み取り専用サービスアカウントを構成する（資格情報をGitHub、サイトソース、チャット、クライアントJSに書かない）。
2. Google Calendar APIを使う安全なWorker Adapterを実装。既存Python公開用射影のOPEN/CLOSE/CANCELLED・繰返し・削除時tombstone・個人情報抑制ルールに対するパリティテストを実施する。
3. 公開JSON比較、更新時間実測、故障模擬、320/375/390/430/768/1440px、外部LINK/メール検証を通過する。
4. GitHub \`main\` への反映は別PR・本人の承認後のみ。

## 注意
この試験版で実際の予約確定はできません。公式LINEは一般問い合わせのみに使用してください。
