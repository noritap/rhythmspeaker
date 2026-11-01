# RHYTHM SPEAKER｜全公式Web 文言UX・情報整理ポリシー v1.0

Updated: 2026-11-01
Status: SUPERSEDED by [RS_WEB_UX_RULES_V2.md](RS_WEB_UX_RULES_V2.md). Historical reference only.
Repository: `noritap/rhythmspeaker`
Canonical source: `PROJECT_PROFILE.md`, `README.md`, current `main`

## Executive Rule

**通常状態を毎回説明しない。例外だけを明示する。重要な条件は利用者が操作する瞬間に伝える。**

この原則を「文章を機械的に短くする」と解釈しない。必要な情報を隠し、CVを悪化させないこと。

## User intent comes first

- 初めての方: 体験できること、料金、持ち物、場所、次に押すボタン
- 既存の生徒: 受講するクラス、講師、日時、申し込み先
- 講師を探す方: 指導スタイルの違い、実際のクラス、問い合わせ先
- 開催者: 利用条件、料金計算、キャンセル・精算・責任分界
- 番組・アーカイブ閲覧者: 作品と再生・開催回・出演者の情報

## Five copy decisions

1. **削除**: 見れば分かる操作手順、同じ画面で繰り返す前置き、内部運用の解説、通常状態の「受付中」バッジ、重複CTA補足。
2. **移動**: 予約確定の条件・送信とコピーの違いは、申込/送信直前の案内へ置く。
3. **維持**: 金額、TIPS適用条件、体験料金、所要時間、道順、クラス選択の違い、講師の特徴、アクセス、定員（詳細）、LINE送信先。
4. **例外を表示**: CLOSE（開講はするが相乗り追加受付なし）、満席（確認済みの場合のみ）、中止、データ更新異常、画像未登録、動画リンク不在、未公開・準備中。
5. **安全保護**: 個人情報/認証/支払い/レンタル制度の条件、著作権、録画・撮影・安全上の注意、操作・アクセシビリティで必要な非視覚情報は削除しない。

## Booking semantics — user-confirmed 2026-11-01

- カレンダー「レッスン296」に掲載されたクラスは**開講決定済み**。
- `OPEN` または末尾指定なし：相乗り参加の申し込みができる。参加枠の確約ではない。
- 末尾 `CLOSE`：クラスは開催するが、新規相乗り申し込みは受け付けない。「満席」「休講」とは呼ばない。
- 生徒の参加予約は、スタジオから明示的な **「予約確定」返信（LINEまたはメール）** が届いた時点で成立。
- この重要条件は予約操作と申込文面に表示し、公開サイト全体の冒頭に反復掲示しない。
- `開催情報を再読み込み` は公開済みGitHub Pagesデータを再取得するだけ。Google Calendar直接更新・課金・訪問者のActions起動はしない。

## 48 HTML inventory reviewed by role

### Public acquisition / student experience
`/`, `/trial/`, `/trial/apply/`, `/pricing/`, `/classes/`, `/classes/{step,tap,stretch,isolation,bar-method,hiit}/`, `/schedule/`, `/about/`, `/access/`, `/faq/`, `/instructors/`, `/instructors/{furusho,homma,mifa,niu,sasasa,okudaira}/`, `/ecosystem/`.

### Content & editorial / services
`/rental/`, `/music/`, `/music/albums/{saa-ittemiyouka,tap-dance-in-suspense,velvet-city-motion}/`, `/broadcast/`, `/broadcast/programs/ayako-no-heya/`, `/broadcast/episodes/{ayako-000,ayako-001,ayako-002}/`, `/rss/`, `/rss/{014,015}/`, `/rss-theater/`, `/rss-theater/qa/`, `/rss-theater/qa/program.html`.

### Independent operational surfaces
`/workshops/`, `/workshops/event.html`, `/workshops/sakaida-koji-20261122.html`, `/workshops/admin/`, `/workshops/instructor/`, `/workshops/instructor/edit.html`, `/instructor-registration/`, `/instructor-submit/`, `/ui-style-catalog/`.

**Scope control**: Above list is the complete repo HTML inventory at review. Not all 48 pages require copy changes. Archive/article content is *substantive information*, not automatically “clutter.” Rental conditions and workshop reservation/auth interfaces are safety-critical. No authenticated, monetary or personal-data flows are changed under this copy-only task.

## Implementation pass v1

- Removed redundant introductory, footer and CTA text from primary pages.
- Removed internal tooling/“data source” explanations from public broadcast and music portals.
- Preserved pricing/TIPS conditions, access arrival guidance and all official LINE destinations.
- Removed duplicated “担当情報を確認後に追記する” editorial status from simple class profiles while retaining confirmed names and roles.
- Replaced generic instructor messaging paragraphs with clear responsibility split (teacher LINE for questions, studio LINE for reservations).
- Reduced visual calendar help; retained meaningful keyboard guidance.
- Kept program content, credits, episode metadata, workshops' actual booking conditions and legal/safety notices.

## Quality gate / future requirements

- Static page and dynamic `assets/ux-lab/app.js` must use coherent, non-contradictory customer-facing wording.
- Verify mobile 320/375/390/430 and desktop layout after deleting blocks.
- Retain keyboard focus and accessible name/description even if visual helper copy is removed.
- Never claim click = booked or that a class is tentative when Google Calendar already commits to it.
- Every page retains a meaningful next action; avoid CTA “learn more” when the destination can be named.
- Check latest `main` and existing feature-branch changes before any copy pass.
- Use PR+CI, then real GitHub Pages verification; successful Action alone is not proof of rendered UX.
- Do not modify external services (STORES/LINE/RS Wallet) or isolated Workshop auth/DB as part of a public text clean-up.
