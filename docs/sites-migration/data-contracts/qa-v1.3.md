# CLASS RESERVATION UX v1.3 QA / 2026-10-31 JST

## 実施・合格
- main SHA/PR状態・台帳差・Profile3.5・AI_OS・Workshop discoveryを確認。GitHub/Calendar/予約/Walletへの書込なし。
- 次月→12月1件、前月→11月7件。11/1選択→2件、再クリック→解除。カレンダー/一覧を往復して日付選択保持。全件一覧は月をまたぐ。
- 本間＋STEPの組合せ→0件、解除で復帰。空結果から新規予約へ移動可能。矢印キーの焦点移動とEnter選択。
- demo-02→詳細→申込文：TAP・11/1 14–15時・本間・public id demo-02を保持。詳細へ戻る／再表示／classesへ移動→ブラウザ戻るで編集済み文面保持。
- copyのクリップボード内容を確認。編集文がmailto bodyへ反映。件名付き。全10名の行き先URLをブラウザ表示から照合。NAOはスタジオ。LINEリンク1件（本間）を実際に開きAdd LINE friendページへの遷移を確認。送信なし。
- 新規：HIIT30分→終了14:30、STEP60分。未定時間を明示選択し内部ページ往復で保持。date/start/teacher/class/durationを保持。日跨ぎ拒否。過去日をnative validationで拒否し生成済み文面を除去（発見不具合を修正して再検証）。
- 表示fixture：sample、正常表示例、予定未取得、同期失敗、人数未取得、開講中止、満席。中止/満席で申込composerなし。unknownを0に変換しない。正常/満席の人数は架空の表示テストだと明記。
- 実ファイル取得失敗を一時的に発生させ、error+LINE/mailのみ、0カード、sample fallbackなしを確認。ファイル復元済み。
- メニュー開閉・同一ページ選択で閉じる。全サービス→schedule、ロゴ→全サービス。既存pricing/faq/trial/classes/instructors/access/about/homeの表示、instructor本間検索1名。HOME hero維持、logo/hero eager画像読み込み正常。
- 通常操作時のサイト由来JavaScriptエラーなし。意図的な取得失敗は捕捉されUIエラー表示。
- node --check app.js/class-finder.js。tests/class-reservation-contract.cjs：契約validation/source混在/連絡先URL/講師ID/人数不正の拒否、null vs 0、満席/取消、時間境界の試験合格。

## レスポンシブ
ブラウザiframe指定幅320/375/390/430/768/1024/1440。実content幅はスクロールバー分15px小さい。検索ページ/カレンダー/申込modal/textarea/新規formのclientWidth=scrollWidth。生成後の新規formを含む。320カレンダー、390フォーム、PC検索カードをスクリーンショットで目視。全幅全画面を目視したという意味ではない。物理スマホは未使用。

## UXライティング自己評価（利用者テストではない）
92/100：初見理解24/25、日本語23/25、行動予測23/25、確定前/データ精度22/25。
HERO・二択・検索・参加CTA・文面生成を具体化。「相談」反復を減らし運用説明を送信直前へ配置。sample/未確定状態の注意は残す。

## 未検証 / 未完成 / 本人確認
未検証：物理スマホ、LINEアプリ内貼付/送信、ネイティブmail client起動・送信、スクリーンリーダー実機、ログイン済み配信画面（gateで阻害する場合）。
未完成：Calendar read adapter、公開用projector、定期同期、live count ledger/API、同時予約処理、確定/取消の実運用、実予約作成。契約とUI fixtureの検証はこれらの完成を意味しない。
本人確認：カレンダーID/権限/公開対象承認、正本となる予約台帳と担当者、講師受付→スタジオ反映/確認連絡の責任分界、30分料金、公開前の運用承認。
