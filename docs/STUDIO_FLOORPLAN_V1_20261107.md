# Rhythm Speaker｜スタジオ平面図 v1.0（ユーザー完成版）

**受領**：2026-11-07
**制作原本**：ユーザー提供「スタジオ図面.002(2).jpeg」／1920×1080px
**目的**：レンタルページでスタジオの位置関係・設備を視覚的に理解できるようにする。
**方針**：ユーザーが完成した画像を原本として保管。図面の構造や文字をAI判断で修正しない。

## 保管する3ファイル

| ファイル | SHA-256 | 備考 |
|---|---|---|
| `assets/images/studio/floorplan/rhythm-speaker-b1f-floorplan-v1-original.jpg` | `ec31f8dbc5cd661e6b6082f55163069fc4e3821e663f3abbf07dd8b94e26cb23` | 原本・963,700 bytes |
| `assets/images/studio/floorplan/rhythm-speaker-b1f-floorplan-v1.webp` | `82c03eb6bc79ec67d2c6c5b42c2352f8f52c1e148cb008d0bd752132d06108ef` | 公開表示用・102,554 bytes |
| `assets/images/studio/floorplan/rhythm-speaker-b1f-floorplan-v1-preview.webp` | `b7c211a4beab3f9a81bb8b189f02abf56206b8a7bba2babb04d7d5344078dc5b` | 低容量プレビュー・37,550 bytes |

**重要：この変更PRは文字情報・表示コードのみをGitHubに保存。画像バイナリはこのPRには含まれません。** 画像3ファイルはチャット内の `rhythmspeaker_floorplan_v1_upload.zip` に保管。

## 掲載場所

- `rental/#studio-floorplan`：実写ギャラリーと設備説明の間。
- 既存の写真・予約システム・Googleカレンダー・料金はそのまま維持。
- 画像をクリックするとWebPを原寸で拡大できる。
- スマホでも16:9の画像の横幅に合わせて縮小。
- `Image.onload`で公開済みファイルの存在確認をしてから図面を表示。未アップロード時は図面の破損画像を出さず「掲載準備中」を表示する。

## 図面の表記と注意点

- 図面の「約98㎡」「約5.4×3.6m」「約19.44㎡」などはユーザー提供図面に記載されている数値。**実測・賃貸契約書との照合は未確認。** 他ページに検証済みの公式数値として転記しない。
- 「大型ミラー（2面）」「80インチテレビ」「音響設備」「更衣スペース」「Wi-Fi」「電源」「ウォーターサーバー」「タップシューズレンタル」が図面の設備項目。
- 「タップ・フラメンコ・アイリッシュダンス対応」が差別化項目。専用シューズの利用条件は予約時に確認。
- この画像は概略図であり、寸法・設備配置は現況と異なる可能性がある。図面を建築図面や安全確認資料の代替にしない。

## 画像本体アップロード方法

1. チャット添付の `rhythmspeaker_floorplan_v1_upload.zip` をダウンロードして解凍する。
2. 画像が意図した最終版であることを確認する。
3. ZIP内の `assets/images/studio/floorplan/` 配下3ファイルを `noritap/rhythmspeaker` の同じパスにコミットする。
4. GitHub Pagesの `/rhythmspeaker/assets/images/studio/floorplan/rhythm-speaker-b1f-floorplan-v1.webp` が表示されることを確認する。
5. `/rental/#studio-floorplan` の図面と拡大リンク、スマホ表示を確認する。

## 変更管理

将来の図面変更では `v2` など別の版名にし、原本v1を上書きしない。元画像の出所、確認日、確認者、寸法の確認状況を更新する。
