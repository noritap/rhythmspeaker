# 未解決・未取得情報

## 原本に未登録

- 個別YouTube動画ID: 19曲（SUSPENSE全14曲、さあ5曲）。具体的な曲名は `MANIFEST.json` の missing_information。
- 正式ジャケット: DISCO 001、VELVET CITY MOTION。原本はtemporaryであり、正式カバーを推測・生成していません。
- DISCO #13のBONUS区分、#14のFINAL区分は正式属性未登録。原本どおり補完していません。
- 発売日、BPM、商用利用許可は原本のnull/unverifiedを維持。

## URL参照のみ・画像ファイル未取得

- DISCO暫定サムネイル: https://i.ytimg.com/vi/xt9ocm2flb8/hqdefault.jpg
- VELVET暫定サムネイル: https://i.ytimg.com/vi/696Y1S6KX5Q/maxresdefault.jpg

前回検証時、元URLから画像ではなくSite Unavailable HTMLを観測しました。配信元と環境中継のどちらが根本原因かは未確定。
現行Sites実ソースはこれらをimgとして使わず、正式未登録と明示したCSS/作品名fallbackを表示します。移植版も同じです。
YouTube iframe内のサムネイルは公式playerの管理下です。抽出画像を別ファイルとして保存していません。

## 再生・検証上の制約

- 全52曲のキュー接続先一致と音声再生成功は別です。継続音声・全曲の終了までの再生は未確認。
- 前回DISCO01/11でプレミア公開待ちの表示を観測。原本の先行試聴記録と食い違いがあり、現行UIは過去観測として注意を表示します。公開日や動画設定は変更していません。
- 19曲は曲名を選んでも特定曲へ直接ジャンプできず、album playlistを表示します。
- LISTEN離脱時は停止します。バックグラウンド・画面横断の連続再生を保証しません。
- 実機スマートフォン試験、Lighthouse定量測定は未実施。過去の63ケースはブラウザiframe幅による検証です。
- GitHub移植版の認証・公開範囲は別管理。Sitesのアクセス制限は付属しません。

## 権利

実ソースに存在したロゴ・正式カバーをそのまま保存しています。新しい利用許諾・ライセンスは付与していません。音声ファイル・ダウンロード機能は同梱していません。
