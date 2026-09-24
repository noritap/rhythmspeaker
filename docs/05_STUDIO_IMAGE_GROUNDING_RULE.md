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

提供された以下の写真6枚をGitHubへ格納する際の**予定パス**。現時点でバイナリのimportが済んだことを意味しない。

| ID | 提供ファイル | Repository path（import予定） | 主な用途 |
| --- | --- | --- | --- |
| RS-STUDIO-01 | 1200×630｜HP シェア用.002.png | `assets/images/studio/reference/studio-01.png` | 鏡・フロア・受付を含む実景 |
| RS-STUDIO-02 | IBJLA2401CUQX6{…}.jpg | `assets/images/studio/reference/studio-02.jpg` | 旧撮影・別時点の室内参考 |
| RS-STUDIO-03 | ダンスフロア.JPG | `assets/images/studio/reference/studio-03.jpg` | スクリーン・受付側の構成 |
| RS-STUDIO-04 | ダンスフロア2.JPG | `assets/images/studio/reference/studio-04.jpg` | 壁面・鏡・室内の位置関係 |
| RS-STUDIO-05 | ダンスフロア3.JPG | `assets/images/studio/reference/studio-05.jpg` | 広角・フロア・鏡面 |
| RS-STUDIO-06 | ダンスフロア4.JPG | `assets/images/studio/reference/studio-06.jpg` | 正面広角・室内の位置関係 |

画像バイナリをimportした後、各ファイルが実際に存在することを検証し、この表を`ACTIVE`に変更する。それまでは`PENDING BINARY IMPORT`。

## 4. Image Creation Rules

1. スタジオ風景を新規生成・加工する際は、上記の対応実景写真を入力参照する。テキストだけの記憶から背景を創作しない。
2. 壁・床・鏡・天井・カウンター等の空間上の位置関係を維持する。素材にない大型窓・別の床色・別構造の鏡・架空の設備は追加しない。
3. 明るさ・ホワイトバランス・コントラスト・構図・軽微な片付けは調整してよい。ただし、実際の来店時と大きく印象が異なる高級スタジオ風への改変をしない。
4. 人物を加える場合、写真の実在人物を無断で別人に加工したり、生成モデルを実際の講師・生徒と誤認させたりしない。必要な場合は実際の許諾済みレッスン写真を優先する。
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
