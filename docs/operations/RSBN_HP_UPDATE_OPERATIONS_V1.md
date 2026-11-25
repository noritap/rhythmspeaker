# RSBN HP更新 運用ルール V1

Version: 1.0.0
Status: ACTIVE（2026-11-26 制定）
適用範囲: RS BROADCAST NETWORK（RSBN）公式HPへの新規Episode反映作業

このドキュメントは、オーナー指示書「RSBN 新規Episode公開更新・継続運用指示書 v1.0」（2026-11-26）を、リポジトリの現行実装に照らして具体化した運用正本である。指示書と実装が異なる点は「§10 指示書との差異」に明記し、実装側を正とする。

---

## 1. 役割と完成条件

- 担当: YouTubeで新規公開された番組Episodeを、RSBN公式HPへ反映し、視聴者が閲覧・視聴できる状態にする。
- 完成条件: **本番HPで最新Episodeが表示され、Episode専用ページで動画再生とチャプター導線が機能すること。** GitHubの更新だけで完了としない。
- 管理対象:
  - GitHub: `noritap/rhythmspeaker`（`broadcast/` 配下）
  - 本番HP: https://noritap.github.io/rhythmspeaker/broadcast/
  - YouTubeチャンネルID: `UCsCznku0uyE4718G5wfj_2Q`（タップダンス教室 リズムスピーカー）
  - 現在の番組: あやこの部屋（`ayako-no-heya`）

## 2. 現行アーキテクチャ（2026-11-26 実確認）

### データ（正本は3つのJSON）

| ファイル | 内容 |
|---|---|
| `broadcast/data/programs.json` | 番組マスター。`id / name / tagline / description / status / category / artwork_url / host_ids / assistant_ids` |
| `broadcast/data/episodes.json` | Episodeマスター（配列）。スキーマは §3 |
| `broadcast/data/people.json` | 人物マスター。`id / name / name_en / role / episode_ids（逆参照）/ official_url / instagram_url / youtube_url / portrait_url / portrait_fallback_url / portrait_usage_status / portrait_permission_basis` ほか |

### ページの描画

- **RSBNトップ**（`broadcast/index.html`）と**番組ページ**（`broadcast/programs/<program-id>/index.html`）は、上記JSONを JS（`app.js` / `home-v3.js` / `program-live.js`）が data属性フック経由で描画する。**Episode追加時にこの2ページを手編集する必要はない**（JSONが正しければ自動で反映される）。
- **Episode専用ページ**（`broadcast/episodes/<episode-id>/index.html`）は1話ごとの静的HTML。新規Episodeごとに新規作成する（§4）。
- **sitemap.xml**（リポジトリroot）に Episode URL を1行追加する。
- 生成スクリプトは存在しない。Episodeページは直近回のページを型として複製・差し替える。

### 検証の仕組み

- `tools/broadcast_audit.py`: 必須ファイル、ID一意性、番組/Episodeページの存在、youtube_id と URL の一致、ゲスト参照、トップと番組ページの data フック存在を検査する。
- CI: `.github/workflows/broadcast-audit.yml`（broadcast/** へのPR・main pushで自動実行）、`broadcast-live-smoke.yml`（本番確認用）。

## 3. episodes.json のスキーマ（実例: ayako-004）

```json
{
  "id": "ayako-004",
  "program": "ayako-no-heya",
  "episode_number": 4,
  "title": "【特別編】濱元智行 × 宇川彩子｜アラブ打楽器「レク」と9拍子タップ即興",
  "guest_ids": ["tomoyuki-hamamoto"],
  "published": "2026-11-16",
  "duration": "29:26",
  "youtube_id": "A06na3GDwKU",
  "youtube_url": "https://youtu.be/A06na3GDwKU",
  "thumbnail_url": "https://i.ytimg.com/vi/A06na3GDwKU/maxresdefault.jpg",
  "summary": "（動画説明をもとにした要約文）",
  "topics": ["improvisation", "odd-meter", "riq", "percussion"],
  "chapters": [{"time": "00:00", "seconds": 0, "label": "オープニング・ゲスト紹介｜濱元智行"}],
  "event_id": null
}
```

- `id` は `<番組の短縮prefix>-<3桁ゼロ埋め>`（例: ayako-005）。`episode_number` は整数。
- `thumbnail_url` は `https://i.ytimg.com/vi/<youtube_id>/maxresdefault.jpg` で統一。
- `chapters` は YouTube側の正式なチャプター情報（保存済みチャプター／説明文）と一致させる。不明な情報を創作しない。

## 4. Episode専用ページの型（ayako-004 が現行の型）

`broadcast/episodes/<episode-id>/index.html` に以下を含む静的HTMLを作る。

- `<title>`: `あやこの部屋 EP.<NN>｜<タイトル短縮形>`
- meta description / canonical / OGP（og:image はサムネイルURL）
- JSON-LD `VideoObject`（name / description / thumbnailUrl / uploadDate / duration は ISO 8601 `PT29M26S` 形式 / contentUrl / embedUrl）
- ヘッダー（番組ホームへのリンク、YouTubeで見るボタン。`data-rsb-event` 等の計測属性は型どおり付ける）
- eyebrow: `あやこの部屋 / EP.<NN> / <duration> / <YYYY.MM.DD>`（特別編はその表記）
- H1・導入文（summary と同内容）
- YouTube埋め込み iframe（`https://www.youtube.com/embed/<youtube_id>?rel=0`）
- CHAPTERS: `chapter-jump` ボタン列（`data-seconds` 付き、chapters と一致）
- HIGHLIGHTS: 見どころカード3枚
- GUEST / PEOPLE: ゲスト紹介
- NEXT WATCH: 前回Episode・番組ホーム・RSBNトップへのカード

## 5. 標準作業フロー

### STEP 1｜新規公開動画の確認
YouTube Studio（MacのChromeログイン済みセッション経由）と本番HPの `broadcast/data/episodes.json` を比較し、公開済みでHP未掲載のEpisodeを特定する。未掲載がなければ変更を行わず、その旨を報告して終わる。

### STEP 2｜正式情報の取得
番組名、Episode番号、動画ID、タイトル、公開日、再生時間、説明文、サムネイル、出演者・ゲスト、チャプター情報を取得する。不明な情報は創作せず、未確認として扱う。

### STEP 3｜GitHub更新（変更は最小限、この4点）
1. `broadcast/data/episodes.json` に新規Episodeを追加（§3 のスキーマどおり）。
2. `broadcast/data/people.json`: 新規ゲストなら人物を追加し、出演者全員の `episode_ids` に新IDを追記する。人物写真は掲載許可の記録（`portrait_permission_basis`）なしに追加しない。写真がない場合は `portrait_fallback_url` にYouTubeサムネイルを使う最小形（ayako-004 の濱元智行の例）でよい。
3. `broadcast/episodes/<episode-id>/index.html` を新規作成（§4 の型）。
4. `sitemap.xml` に Episode URL を追加。
- トップページ・番組ページ・人物アーカイブ・テーマ別探索・コーナーは JSON 描画のため手編集しない。

### STEP 4｜検証
- `tools/broadcast_audit.py` の観点で自己点検する（ID重複なし、youtube_id と URL の一致、ゲスト参照の実在、ページの存在）。
- PR作成後、CI `broadcast-audit` の合格を確認する。

### STEP 5｜本番公開
PRを作成し、既存のマージルール（常時ルール）に従って main へ統合する。GitHub Pages の反映を待つ。

### STEP 6｜本番確認
- 本番の `broadcast/data/episodes.json` が最新化されていること。
- RSBNトップで最新Episodeが表示されること。
- Episode専用ページが開け、動画埋め込みとチャプターボタンが機能すること。
- 番組ページの Episode Archive に反映されていること。

## 6. 継続運用のトリガー

オーナーが次のいずれかを指示したら、本ルールに従って STEP 1 から開始する。

- 「RSBNを更新して」
- 「最新回をHPに反映して」
- 「RSBNの今日の分」
- 「RSBNをデバッグして」（この場合は不整合の検出と報告を主とする）

毎回、GitHub最新mainと本番HPの両方を確認してから作業する。新規公開がなければ不要な変更・コミットはしない。

## 7. 禁止事項

- 不要なシステムの新規開発、無断でのデザイン刷新
- 既存コンテンツの削除
- 未公開・限定公開の扱いが未確認の動画の掲載（公開済みのものだけを載せる）
- 不確かな情報の創作（チャプター・出演者・日付は正式情報に基づく）
- 人物写真を許可記録なしに追加すること
- 不要なコミットやデプロイ
- 本番未反映の状態での完了報告

## 8. 作業報告の形式

毎回、簡潔に以下を報告する。

- 新規公開Episode／HP未掲載だったEpisode
- 更新内容
- GitHub反映状況（PR・CI・マージ）
- 本番公開状況と本番URL
- 未解決事項

## 9. 現状スナップショット（2026-11-26 実確認）

- 本番＝main で一致。Episode は ayako-000〜ayako-004 の5件。最新は EP.04 濱元智行（2026-11-16 公開、A06na3GDwKU）。
- 人物は6名登録（宇川彩子、古庄里好、鈴木心理、橋本タクト、今井萌愛、濱元智行）。
- **既知のデータ不足**: episodes.json で EP.01 は `published` が null、EP.02 は `published` と `duration` が null（ページ側には情報がある可能性）。次回更新のついでに補完を検討するが、単独では変更しない。

## 10. 指示書 v1.0 との差異（実装を正とした点）

1. 指示書は「過去のEP.00〜EP.03」を前提とするが、実際は EP.04 まで公開・掲載済み。
2. 指示書 STEP 3 の確認対象（トップページ、番組ページ、人物アーカイブ、技術・テーマ別探索、レギュラーコーナー）は、実装上は JSON からの自動描画であり、手編集の対象ではない。実際の変更対象は §5 STEP 3 の4点。
3. 指示書に無い実装上の必須作業: sitemap.xml への追記、Episodeページ内の JSON-LD/OGP、people.json の写真許可記録、CI（broadcast-audit）の合格確認。
4. Episodeページの生成スクリプトは存在しない（静的HTMLを型から作る）。
