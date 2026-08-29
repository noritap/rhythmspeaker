# Rhythm Speaker Trial Photo Usage Spec

Status: ACTIVE UX SPEC
Scope: `/trial/` — 初回体験の安心材料として使う実景写真

## Purpose

写真は装飾ではなく、初回体験前の不安を減らすEvidenceとして使用する。

優先する説明:

- 本当にタップシューズを借りられる
- 本当に動きやすいウェアを借りられる
- 仕事帰り・外出帰りでも手ぶらで参加できる
- 実際のRhythm Speakerの運用が想像できる

## Current production assets

- `assets/images/trial/rental-tap-shoes.webp`
  - 用途: 「タップシューズ無料レンタル」の実物証拠
  - Primary placement: `/trial/` → 「初回体験に含まれるもの」→ タップシューズ

- `assets/images/trial/rental-wear.webp`
  - 用途: 「レンタルウェア無料」の実物証拠
  - Primary placement: `/trial/` → 「初回体験に含まれるもの」→ レンタルウェア

## Newly supplied wear photos — 2026-08-29

Current state: `PENDING BINARY IMPORT`

会話で追加された2枚は、generic stockとしてではなくRhythm Speaker実景素材として採用する。

### Wear Photo A

Visual:
- 黒系の動きやすいウェア
- ベンチに座った状態
- 片脚を伸ばしている
- スタジオ利用時の自然な着用イメージ

Recommended repository filename:
`assets/images/trial/rental-wear-fit-black.webp`

Primary content match:
- 「仕事帰りに手ぶらで通いたい」
- 「レンタルウェア」
- 「本当に手ぶらで大丈夫ですか？」

Recommended placement priority:
1. `/trial/` の「仕事帰りに手ぶらで通いたい」カード周辺
2. 「初回体験に含まれるもの」のレンタルウェア補助写真
3. FAQ「本当に手ぶらで大丈夫ですか？」付近

Do not use as:
- HEROの主写真
- 講師プロフィール写真
- タップシューズの証拠写真

### Wear Photo B

Visual:
- スポーツウェア / トラックパンツ系
- ベンチに座った自然な着用状態
- 動きやすい服装の具体例として理解しやすい

Recommended repository filename:
`assets/images/trial/rental-wear-fit-trackpants.webp`

Primary content match:
- 「動きやすいウェアも無料」
- 「どんな服装で参加するのか」
- 「着替えを持参しなくてよい」

Recommended placement priority:
1. レンタルウェア詳細のsecondary image
2. 体験当日の流れ「15分前に来店 → 着替え」付近
3. FAQ / 手ぶら参加説明の補助

Do not use as:
- 単独の大判HERO
- 商品販売写真のような見せ方

## Layout Rule

新しい2枚を入れる場合、1セクション内に写真を過剰投入しない。

Recommended composition:

- タップシューズ: 1枚
- レンタルウェア主写真: 1枚
- レンタルウェア着用例: 2枚を小さめの2-column / horizontal scroll galleryとして使用

Mobile:
- 1-columnまたは2枚horizontal scroll
- 横スクロールがページ全体へ漏れない
- 画像の高さを固定しすぎず、人物が切れすぎない
- `object-fit: cover`使用時は顔・足・服装の意味が消えないcropにする

## Image Quality Gate

公開前に必ず確認:

1. 黒画像になっていない
2. 明るさが不足していない
3. 人物・ウェア・シューズが切れすぎていない
4. 画像がカード幅を破壊しない
5. lazy loadingでスクロールが重くならない
6. alt textが内容を説明している
7. PC / smartphone双方で表示確認

## Technical Policy

写真はCSS `::before` backgroundだけに依存せず、意味のある証拠写真は原則`<img>`として配置する。

Recommended attributes:

```html
<img
  src="..."
  alt="..."
  loading="lazy"
  decoding="async"
>
```

## Current implementation note

2026-08-29のtrial page改善で、タップシューズ / レンタルウェアの既存2資産はCSS pseudo-backgroundから明示的`<img>`へ変更済み。

新規2枚は会話上では採用済みだが、GitHubへ書き込める画像binaryとして取得できた時点で上記filenameへimportし、本文との意味対応を維持して配置する。

## Done Condition

- 既存レンタルシューズ写真が正常表示
- 既存レンタルウェア写真が正常表示
- 新規Wear Photo A / Bがrepository asset化
- 内容に対応した場所へ配置
- PC / smartphoneでcrop・brightness・performanceを確認
- 写真が単なる装飾ではなく「手ぶらOK」の理解を強化している
