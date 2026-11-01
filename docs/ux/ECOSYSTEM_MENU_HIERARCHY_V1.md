# RHYTHM SPEAKER｜全サービスメニュー 情報設計 v1.0

Status: Implemented in feature branch for review; do not treat as production until PR merged
Date: 2026-11-01
Owner objective: 初見で理解できる名称、事業構造より利用目的、重要度を視覚と配置で区別

## User-facing naming

- 旧「通常クラス予約」 → **レッスン日程**（既存URL `/schedule/` は変更しない）
- 「初回体験 ¥1,000」は価格が選択に直結するため維持
- 「クラス」は必要に応じ「クラス紹介」、料金ページへの補助導線は「料金」
- STORESの商品販売先 → **オリジナルグッズ**（ウェア・音楽・デジタル作品）。公開商品一覧への外部リンク。商品購入先が本当にSTORESであることを保つ
- はてなブログ → **商品レビュー**／補助ブランド「リズムスピーカー商店」。自社販売店ではなく、比較・選び方・紹介記事のメディア
- 「マイページ」→ RS Wallet（既存残高/履歴の確認）。新規体験の優先CTAにはしない

## Hierarchy / weighted information architecture

| Tier | Presentation | User job | Destinations |
|---|---|---|---|
| P0 | 画面冒頭の大カード2個。最も強い視覚強度。スマホは縦積み | はじめて体験する／直近の開催を探す | `/trial/` , `/schedule/` |
| P1 | 中型カード・上位グループ | クラス／講師を知る、ワークショップを探す | STUDIO, EVENTS, `/classes/`, `/instructors/`, `/pricing/`, `/rental/` |
| P2 | 補助カード・3列（PC） | 観る／聴く／練習方法を知る | WATCH, MUSIC, LEARN |
| P2 | 役割分離した2カード | 自社作品を買う／商品紹介を読む | ORIGINALS/STORES, REVIEW/Hatena |
| P3 | 補助カード・3列（PC） | 教室を調べる／会員情報確認／問い合わせ | ABOUT, RS Wallet, CONTACT |

**Important:** P0は売上順位を意味しない。初めて来た人が何を押すか迷わないことを目的とする。体験・日程を目立たせても、番組・音楽・関連事業の主導線は維持する。

## Link behavior contract

- URLは既存の本番サービス・既存ルートを使用。新規決済・認証は実装しない。
- `/schedule/`: 公開済み開講日程への参加申込と希望日時での相談。申込操作だけで予約確定しない。
- `/trial/`: 新規顧客の初回体験案内・申込の入口。
- `https://rhythmspeaker.stores.jp/?all_items=true`: STORESの商品一覧入口。トップページは教室情報が多いため商品一覧へ直接導く（商品URLが将来変更された場合はリンク監査）。
- `https://rhythmspeaker.hatenablog.com/`: リズムスピーカー商店の記事。サイト上で直接販売する機能とは混同しない。
- `/ecosystem/?category=learn`: 専用オンライン学習サイトは準備中のため、確定済みクラスへの案内のみ。存在しない講座へ誘導しない。
- LINE/メール/RS Wallet/YouTube/個人サイトなど他の既存リンクは従来どおり残す。

## UI / responsive

- 320/375/390/430px: 主CTAと全サービスカードを1列、44px程度のタップ対象、左右スクロールなし。
- 768/1440px: 主CTA 2列、レッスン/買い物 2列、メディア/その他 3列（画面に応じ2列へ移行）。
- 各カードは主リンク + 独立した補助リンク。透明な重なり領域が補助リンクを妨げないかブラウザで操作検証。
- 各サービスグループはh2、カードはh3。旧番号「01 DISCOVER / 09 UTILITY」はユーザーの判断に必要ないため非表示。
- 注意事項・料金条件・予約確定要件は、決定/操作の段階に残す。外部サイトの宣伝を先頭に置かない。

## Review / QA

- `tools/test_navigation_portal.py`: 10カテゴリのリンク先、全カード見出し、P0の順序・2つのショッピング先の区別、デスクトップ/モバイル共有メニュー。
- `tools/sites_migration_browser_check.js`: 10ページ×6幅の回帰、ポータルカードのリンクとフォーカス/横スクロール。
- `tools/navigation_audit.py --strict`: RS-NAV-2の十項目グローバルナビはそのまま維持。「SHOP」は既存の正本メニュー名として維持し、利用目的が分かりやすい名称は全サービス内に配置する。
- `tools/sitewide_copy_contract.test.cjs`: 予約・料金・プライバシーなどの重要情報保護。
- Metrics after release: 日程ページ遷移率・初回体験ページ遷移率・商品一覧と記事の遷移混同・LINE導線到達。Analytics実数の取得なしに成果改善を断定しない。

## Risks / deferred

1. STORESの「商品一覧」リンクがサービス側で変更された場合の保守。
2. 公式Webのグローバルナビに残る「SHOP」の再命名は、RS-NAV-2とprotectedの `rss/index.html` を含む別レビューが必要。意図しない全サイト名称変更は行わない。
3. 実利用者が「音楽作品購入」と「音楽を聴く」を混同しないか、公開後の小規模ユーザーテストで確認。
4. 販売事業の収益順位は未検証のため、商店と商品販売のビジュアル優先度はUX仮説として評価する。

## Acceptance

- P0「初回体験」「レッスン日程」がメニュー冒頭で視認できる
- 「オリジナルグッズ」「商品レビュー」が独立カードで異なるURLへ移動
- すべての元の9サービス入口が消えていない（10番目に記事メディアを独立追加）
- PCとスマホ、静的HTMLとJS描画のリンク先が一致
- 既存予約・料金・配信・問い合わせ導線が壊れていない
