# Rhythm Speaker — クラス写真・講師写真・実景写真の使い分け

Status: ACTIVE / 2026-10-09
Scope: TOP, /classes/, six class detail pages, instructor pages, /trial/, /access/, /about/.

## 1. クラス識別写真 (CLASS IDENTITY)

**TOPの6枚が唯一の正本**。以下の同一ファイルを全クラス選択面で使う。

| Class | Source (1100w; 640w available for listing) |
| --- | --- |
| STEP | `assets/classes/class-step-editorial-v3-1100w.webp` |
| TAP | `assets/classes/class-tap-editorial-v1-1100w.webp` |
| STRETCH | `assets/classes/class-stretch-editorial-v1-1100w.webp` |
| ISOLATION | `assets/classes/class-isolation-editorial-v1-1100w.webp` |
| BAR METHOD | `assets/classes/class-bar-method-editorial-v1-1100w.webp` |
| HIIT | `assets/classes/class-hiit-editorial-v1-1100w.webp` |

- All are square editorial posters: **1:1 + `object-fit:contain`**, no cropped typography or faces.
- TOP and /classes/ use responsive 640w/1100w variants; class detail uses the 1100w variant.
- Do not replace with `hero.jpg`, studio photos, instructor photos or unrelated class photos.
- One canonical identity image per class detail. Do not repeat the same dancer shot on all level/concept cards.
- The image must remain a real `<img>` with dimensions and a meaningful `alt`; don't put text on top of it.
- Styles are centralized in `classes/photo-system.css`; check `scripts/class_photo_contract.py`.

## 2. 講師識別写真 (INSTRUCTOR IDENTITY)

- TOPの承認済み10名の画像が正本。詳細は `assets/instructors/README.md`。
- 正方形、`contain`、文字や顔を切らない。写真の上に講師名・タグを重ねない。
- STRETCHの講師欄もMiFa-san / 古庄里好の同じ公式画像を使う。

## 3. 場所の証拠写真 (REAL STUDIO)

- /access/ と /trial/ の施設案内には、実際のスタジオを確認できる実景写真を使う。
- ストレッチのアウトカム写真や人物ポスターを、建物・道順の証拠写真として流用しない。
- **道順写真が存在しないときは、架空の道順写真や関係ないダンサー写真を使わず、番号＋テキスト＋地図にする。**
- `docs/05_STUDIO_IMAGE_GROUNDING_RULE.md` の実景基準を守る。旧撮影時点の写真を現在の設備と誤認させない。

## 4. レッスンの情景写真 (EXPERIENCE / EVIDENCE)

- /trial/ の YOUR START は初回体験のイメージ・不安解消が目的。TOPの「目次写真」とは役割が異なるので、意味のある情景写真を保持する。
- STRETCHの動作例は、クラスの目標・身体の使い方を説明するための別写真として扱う。
- 写真は説明と対応させ、同じ画像の無意味な連続使用を避ける。
- 人物の顔・靴・身体の動きなど説明に必要な部分が欠けないよう、自然な比率で表示する。

## 5. Quality gate

- 360 / 375 / 390 / 768 / 1280px: 横スクロール、画像切れ、CTA干渉、文字可読性を確認。
- 画像の `width` / `height`、`alt`、`loading`、`srcset`、読み込みエラーを確認。
- `python3 scripts/class_photo_contract.py` と `python3 scripts/instructor_photo_contract.py` を実行。
- Source of truth is GitHub main. New photos or replacements require a separate approval and source review.
