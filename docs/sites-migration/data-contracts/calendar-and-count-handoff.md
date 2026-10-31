# 通常クラス予約 v1.3 / GitHub移植・実連携引継ぎ

## 正本と今回の境界
確認日2026-10-31 JST。公式main `1ef8f6b06b96255b334209cb53d4fc801aeafc6c`、Profile3.5。
Draft PR297 `2e15fbd9f7126e068442bd2ecc9c427bb7b59e3f` は未統合。main講師台帳1.3は6名、PR案1.4は10名。今回のみ明示指示に従いPR連絡先を使用。担当未確認4名のクラスを創作しない。
AI_OS_CREATION_RULES/READMEのRemote-First・正本分離・検証ルールを参照。ワークショップdiscoveryのUIのみ継承。RSStore/Supabase、予約DB、Auth、決済処理は持ち込まない。
レッスン時間はCONCIERGE `01_REFERENCE_DATA/11_CLASS_AND_LESSON_REFERENCE.md`（blob c0f62f45004ce9b5e87ff6d1b5cc079c9b99e25a）でSTEP/TAP/STRETCH/ISOLATION60分、BAR/HIIT30分。30分料金の確認なし。料金は既存#/pricingへ分離。

## ページ・コンポーネント・デザイン
routeはclass-reservation-contract.json参照。main router→classFinder→data validation→finder/results or request form。Native dialogにdetail→applicationの2段階、フォームはdraft→review→copy/manual external handoff。
Components: Hero, source notice, two-choice mode cards, source/update status, teacher search, class filter, removable chips, month/date grid, calendar/list switch, compact class card, detail modal, request form, editable composer, contact actions, empty/error states, collapsible developer fixture selector, booking flow。
生成り/白/黒は既存app.css継承。class-finder.cssでスコープ。calendar左360px+結果desktop、<=1000px左310px、<=760px1列、<=400px予約方法カード1列。フォーム時間はmobile1列。ボタン44px以上の高さ、日付7列、フォーカス3px、native label/aria-pressed/status/modal title。
既存header/menu/footer、STUDIO、classes、instructor detailから接続。logo→全サービス、brand name→教室トップ、trial/pricingは維持。

## カレンダー同期インターフェース（未実装）
1. 本人が「レッスン296」「296レンタル」のID・所有者・読取権限・公開対象条件を確認。Google Calendar API events.list/get（readonly scope）をサーバーで使用。必要最小のカレンダーへ限定。秘密情報はサーバー環境管理のみ。
2. イベントを単にタイトルから公開しない。OPEN＋管理者が公開可能と承認した通常クラスだけ。CLOSE/レンタル/私用を除外。レンタルカレンダーは非公開の競合確認用に限定し、講師の空き保証へ変換しない。
3. 非公開mapping table: internal calendarId,eventId, recurringEventId, originalStartTime → stable opaque publicSessionId。繰り返しはsingleEventsで展開、occurrence(originalStartTime)ごとにIDを固定。日時移動は同一IDへrevision更新、公開用日時だけ変更。シリーズ全体の人数を使わない。
4. 取消/削除はshowDeleted/syncTokenで検出し公開CANCELLED tombstoneへ。既存申込者への連絡は管理者の別ワークフロー。syncToken410は安全な再全件同期。取得済範囲・削除追跡を管理。
5. 二重登録は内部identity/iCalUID+occurrence等で候補検出し、同名同時刻のみで自動統合しない。管理者解決。公開IDは重複させない。
6. 初期提案5分間隔（要承認）、月範囲取得、ページネーション、バックオフ、監視。公開JSONはallowlist projector+契約検証後に原子的置換。generationAt/lastSuccessfulSyncAt/lastAttemptAtを保持。失敗時にサンプルへフォールバックしない。古い情報を表示する場合はstale明示と参加申込停止ポリシーを先に決定。
7. 公開項目は契約のみ。生タイトル/説明、attendees、organizer、非公開予定、連絡先、Google識別子、認証情報を公開artifactに含めない。

## 予約人数の正本と権限（提案・未実装）
- 正本候補は通常クラス専用の確定予約台帳。Workshop予約DBと共有する前提にしない。採用場所と管理責任者は本人確認が必要。
- private Reservation{reservationId,publicSessionId,status:inquiry|pending|confirmed|cancelled,seatCount,version,createdAt,updatedAt};個人情報は別途非公開、最小収集/保存期間を決定。
- 公開aggregateはconfirmedで未取消のseatCount合計のみ。query/pendingを含めない。権限あるスタジオ担当者が確定・取消。講師は担当枠の必要最小権限（要決定）。訪問者に人数書込権限なし。
- 確定時はトランザクションでcapacity比較、同時確定を直列化/optimistic version check、idempotencyKeyで再送防止。操作監査ログ。取消は同じトランザクションで状態更新+再集計。手入力の人数と予約台帳の二重正本にしない。
- 読取失敗/不明はnull+unknown。0と区別。count sourceは公開可能な集計種別だけ。full判定は確認済count>=capacityだけ。UIでの表示は席確保ではなく、送信時再確認必須。

## 問い合わせ・確定運用
講師直接申込は現行mainのスタジオ統一窓口を拡張する提案。一次受付は講師、正式確認とスタジオ台帳反映の担当・期限を決める。ユーザーへの確認連絡後に確定。変更/取消/料金はスタジオLINE。未承認のまま本番運用へ移さない。
LINEはURLを開くのみ、文面コピー後に本人が貼付・送信。メールはsubject/body生成のみ。sample messageは実予約でないと明記。Sitesは送信しない。

## QA合格条件と本番ゲート
month/date/keyboard/filter/reset/empty/calendar-list sync、sample/cancel/full/countunknown/unavailable/syncfailureの区別、detail→reviewで全選択値保持、内部往復とback/forward保持、10講師URL、メール編集反映、copy、duration30/60のclass連動、未来日時/日跨ぎ拒否、320/375/390/430/768/1024/1440のはみ出し、焦点・エラー・画像、既存主要ページ回帰。
今回外部送信・実予約・CalendarAPI・countsDB・LINEアプリ実機・mail client送信・スクリーンリーダー実機は未検証。UI fixtureのPASSは実同期PASSを意味しない。
移植時はstatic JS/CSSを既存HPへ適合、URL/SEO/canonicalは別途設計、Google/台帳の権限・秘匿・同時実行テスト・監査・連絡運用の承認・実機LINE検証を経て本番公開を判断する。今回GitHub変更・ZIP最終出力なし。
