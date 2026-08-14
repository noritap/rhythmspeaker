# Rhythm Speaker Web｜Navigation Role Decision v0.1

Status: DECIDED / PRODUCTION-ALIGNED
Date: 2026-08-14

## 1. Decision

Rhythm Speaker公式Webのナビゲーション役割を以下で固定する。

- 左上のRhythm Speakerロゴ = GitHub公式Webの教室トップへ戻る
- 「メインHP・SHOP」 = https://rhythmspeaker.stores.jp/ へ移動する明示的な外部導線
- 「体験予約」 = Official LINEへのPrimary CTA
- 「RS Wallet」 = 継続利用向けSupporting CTA

STORESへの導線を左上ロゴだけに依存させない。

## 2. Reason

左上ロゴだけをSTORESリンクにすると、ユーザーはロゴが外部サイトへの導線であることを認識しにくい。

一方、メニュー内に「メインHP・SHOP」を明示すると、以下を両立できる。

- 新公式Web内の回遊性を維持
- STORESへの帰還導線を明確化
- 初回体験CTAの優先順位を維持
- 新規客と既存客の導線を分離
- モバイルでも外部導線の意味を理解しやすい

## 3. Navigation Architecture

```text
Rhythm Speaker logo
  -> 教室トップ（GitHub Official Web）

教室トップ
初回体験
クラス
教室紹介
FAQ
アクセス
メインHP・SHOP
  -> STORES

体験予約
  -> Official LINE

RS Wallet
  -> RS Wallet
```

## 4. Platform Roles

### GitHub Official Web

DISCOVER / UNDERSTAND / REDUCE ANXIETY / CONVERT

### Official LINE

BOOK / CONTACT / CONVERT

### STORES

MAIN HP / SHOP / BUY

### RS Wallet

AUTH / TIPS / USE

## 5. UX Rule

Primary CTA hierarchyを崩さない。

1. LINEで初回体験を予約する
2. 教室内ページへ移動する
3. メインHP・SHOPへ移動する
4. RS Walletを見る

STORESリンクをPrimary CTA化しない。
RS Walletを体験前必須に見せない。

## 6. Mobile Rule

SP / Tabletでは展開式メニュー内に「メインHP・SHOP」を独立項目として表示する。

- 教室内リンク群と視覚的に区別してよい
- タップ領域を十分確保する
- LINE固定CTAとの重なりを避ける
- ロゴは教室トップへ戻る一貫したホーム導線として扱う

## 7. Copy Rule

Productionでは現時点で以下を採用する。

`メインHP・SHOP`

将来、STORESの役割が商品販売中心に変化した場合のみ、以下のようなラベル変更を再評価する。

- Rhythm Speaker SHOP
- SHOP・既存サイト

現時点では変更しない。

## 8. Do Not Regress

レビューなしに以下へ戻さない。

- ロゴだけをSTORES導線にする
- STORESを新公式WebのPrimary CTAにする
- LINE体験予約よりSTORESを強く見せる
- RS Walletを新規客のPrimary CTAにする

## 9. Validation

2026-08-14のiPhone実機確認で、以下を確認済み。

- 左上ロゴが教室トップのホーム導線として機能
- モバイルメニューが開閉可能
- 「メインHP・SHOP」が独立項目として視認可能
- LINE体験予約CTAが主導線として維持
- 新公式WebのHEROを保持したまま外部導線へアクセス可能

## 10. Next Priority

Navigationの役割はこの決定でロックする。

次の優先作業は、Development Priorityに従い、SEO / Search Assetの基礎整備へ進む。
