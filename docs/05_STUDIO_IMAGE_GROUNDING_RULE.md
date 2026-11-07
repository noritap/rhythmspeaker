# Studio Image Grounding Rule

Status: ACTIVE VISUAL POLICY
Scope: Rhythm Speaker公式Webで使用する池袋スタジオの実景・スタジオ背景生成・画像加工

## 1. Purpose

公式Web、とくに `/trial/` の写真は、来店前の不安を減らすEvidenceとして使用する。実スタジオと異なる架空の空間を公式スタジオとして提示しない。

## 2. Source of Truth

- 古庄が提供したRhythm Speaker池袋スタジオの実景写真を背景の正本参照とする。
- 鏡、グレー系の木目フロア、白い壁、黒い吸音材、天井照明、受付カウンター、収納棚、スクリーン等、実景に写る特徴を基準とする。
- 複数の撮影時期・角度で異なる設備配置は、それぞれの写真の時点に属する。写真同士を無条件に合成して現在の設備配置と断定しない。
- 参照写真に写らない部分は創作で確定させず、必要なら追加の実景写真を取得する。

## 3. Reference Assets

提供された以下の写真6枚はGitHubの作業ブランチへimport済み。マージ後にmain上の正式参照素材として使用する。

| ID | 写真タイトル（内容が分かる名前） | Repository path | 主な用途 |
| --- | --- | --- | --- |
| RS-STUDIO-01 | スタジオ内観・フロア／鏡／受付（シェア用） | `assets/images/studio/reference/studio-interior-share-image-floor-mirror-reception.png` | OG画像・教室紹介・スタジオ全体の説明 |
| RS-STUDIO-02 | スタジオ内観・旧撮影アーカイブ | `assets/images/studio/reference/studio-interior-archive-older-view.jpg` | 撮影時期の違いを含む内部参照。現況の断定には使わない |
| RS-STUDIO-03 | ダンスフロア・スクリーン／受付側 | `assets/images/studio/reference/studio-screen-and-reception-side-view.jpg` | 設備・受付側の空間説明 |
| RS-STUDIO-04 | ダンスフロア・鏡のある壁面 | `assets/images/studio/reference/studio-dance-floor-mirror-wall-view.jpg` | 鏡・壁面・フロアの構成説明 |
| RS-STUDIO-05 | ダンスフロア・鏡の広角写真 | `assets/images/studio/reference/studio-wide-angle-dance-floor-and-mirror.jpg` | レンタル／教室紹介の別角度写真 |
| RS-STUDIO-06 | ダンスフロア・正面からの広角全景 | `assets/images/studio/reference/studio-front-wide-angle-dance-floor-overview.jpg` | レンタル／教室紹介の主要写真 |

Asset status: `ACTIVE / VERIFIED ON MAIN`。2026-11-08、6ファイルを内容別の説明的ファイル名へ整理。ファイル名変更は同一Git blobの移動で行い、画像バイナリは変更していない。

## 4. Image Creation Rules

1. スタジオ風景を新規生成・加工する際は、上記の対応実景写真を入力参照する。テキストだけの記憶から背景を創作しない。
2. 壁・床・鏡・天井・カウンター等の空間上の位置関係を維持する。素材にない大型窓・別の床色・別構造の鏡・架空の設備は追加しない。
3. 明るさ・ホワイトバランス・コントラスト・構図・軽微な片付けは調整してよい。ただし、実際の来店時と大きく印象が異なる高級スタジオ風への改変をしない。
4. 人物を加える場合、写真の実在人物を無断で別人に加工したり、生成モデルを実際の講師・生徒と誤認させたりしない。必要な場合は実際の許諾済みレッスン写真を優先する。
   - `/trial/` の演出画像で生徒のプライバシー保護が必要な場合、生徒の顔はぼかしや無表情の塗りつぶしではなく、自然な別人の顔へ変更する。元の生徒を特定できないことを確認する。
   - インストラクターを本人として見せる場合、顔を別人に再生成しない。本人の識別が重要な素材では元写真の顔を保持する。生成結果の顔が元写真と一致しない場合は、実写記録や本人写真として扱わない。
5. 生成・合成画像は`実際のスタジオ写真`として断定しない。現地の設備や雰囲気を説明する主証拠は実写真とする。
6. 画像の目的ごとに一枚ずつ制作・レビューし、合格した画像のみ適切なページへ配置する。

## 5. Trial Hero / Mobile UX

- Heroでは「初心者でも始められる」「本当にここで習う」という期待と信頼を両立する。
- 実際のスタジオの空間とタップの足元が確認できる構図を優先する。
- デスクトップではテキストと写真が競合しないこと。スマホでは独立した縦方向の表示、人物・靴・床が切れすぎないcropを確認する。
- LCP対象のHeroに不用意な`loading="lazy"`を付けない。適切な画像サイズ、`width`/`height`、軽量な公開用WebP等で表示性能を確保する。
- altには写っている事実だけを書く。生成・演出画像を実際のレッスン記録のように記述しない。
- 初回体験予約のLINE CTA、料金、シューズ・ウェアの実物写真を画像変更で妨げない。

## 6. Workflow / Quality Gate

1. 使用箇所と不安解消目的を定義する。
2. 必要な実景参照画像と撮影時期を選択する。
3. 写真補正・実写合成・AI生成のいずれかを判断し、AI生成の場合は誤認リスクを確認する。
4. まず一枚制作し、実景との一致・人物の扱い・自然さをレビューする。
5. PC / SPでcrop、明るさ、容量、描画速度、CTAとの干渉、alt、画像の読み込みエラーを検証する。
6. feature branch → PR → CI → main → GitHub Pages実URLの順に検証する。

## 7. Related Rules

- `docs/03_TRIAL_PHOTO_USAGE_SPEC.md`：レンタル用品の実物証拠写真、配置、表示品質
- `PROJECT_PROFILE.md`：公式Webの上位Image PolicyとProduction保護
- `README.md`：運用入口


## 8. Studio Photo File Naming / Storage Rules

- ファイル名は英小文字のASCII kebab-caseとし、`studio-01` のような連番だけの名前を新規採用しない。
- `studio-[content]-[view-or-purpose].[ext]` を基本とし、写真の主題・視点・用途がファイル名から分かるようにする。
- 原本のカメラファイル名は台帳の `source_filename` に保持し、リネーム後も元ID（RS-STUDIO-xxxx）で追跡できるようにする。
- 原本・Web掲載用WebP・サムネイルは同じ説明的basenameを使い、保存階層で区別する。
- 画像を実際に確認できていない場合は、説明を推測で確定せず `UNVERIFIED` とする。
- 用途は `data/studio-photo-library.json` のタイトル・説明・推奨用途・公開状態を正本とする。
- 24枚の2026-11写真は原本バイナリが未登録のため、説明的な保存予定名のみを台帳に設定する。実ファイルの保存完了とは扱わない。
