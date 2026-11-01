# RHYTHM SPEAKER｜公式Web UX・文言・ナビゲーション統合ルール v2.0

- Version: **2.0**
- Updated: 2026-11-01
- Status: **ACTIVE after PR #314 release**
- Repository: `noritap/rhythmspeaker` / `main` / GitHub Pages
- Origin: [SITEWIDE_COPY_POLICY_V1](SITEWIDE_COPY_POLICY_V1.md), [ECOSYSTEM_MENU_HIERARCHY_V1](ECOSYSTEM_MENU_HIERARCHY_V1.md), `docs/03_NAVIGATION_REGISTRY.md`, 会話で確認した予約・商店の分類
- Role: **WHAT THE USER SEES / HOW LINKS ARE NAMED AND PRIORITIZED**. Identity/ownership/security は `PROJECT_PROFILE.md` が優先し、共通開発方法は `AI_OS_CREATION_RULES` に委譲する。

## 0. One principle

> **通常は説明しない。例外は明示する。重要な条件は操作の直前に伝える。**

文章の短さだけを追求しない。初見の利用者が「何ができる・いくらかかる・次にどこを押す」を理解できることを優先する。

## 1. Sitewide naming contract

| Concept | Public label | Destination |
|---|---|---|
| 開催日程から受講を探す | **レッスン日程**（旧「通常クラス予約」） | `/schedule/` |
| 新しく始める | **初回体験 ¥1,000** | `/trial/` → `/trial/apply/` |
| クラスを説明する | **クラス紹介**（ナビ見出しは「クラス」も許容） | `/classes/` |
| レッスンの費用 | **料金**（ページ内「料金・通い方」は許容） | `/pricing/` |
| 独自制作商品を買う | **オリジナルグッズ**（旧「公式ショップ」/「SHOP」） | `https://rhythmspeaker.stores.jp/?all_items=true` |
| 商品を選びレビューを読む | **商品レビュー** / 補助ブランド「リズムスピーカー商店」 | `https://rhythmspeaker.hatenablog.com/` |
| 受講生の残高等 | **マイページ**（補足「RS Wallet」） | `https://tips-app-seven.vercel.app/` |
| 質問・予約連絡先 | **お問い合わせ** / **公式LINE** | `https://lin.ee/zC5YLe7` |

表記はリンク先の実際の機能と一致させる。店舗ブランド名を露出したい場合も、利用者が行える動詞（見る・予約する・買う・読む）を優先する。

## 2. Purpose-first hierarchy, not department-first menu

1. **P0** 最初の2大行動: `初回体験 ¥1,000`、`レッスン日程`。ページ上部の大カード2個。スマホ1列/PC2列。
2. **P1** レッスン・イベント: 教室、クラス、講師、料金、スタジオレンタル、ワークショップ。
3. **P2** 観る・聴く・学ぶ: 番組/動画、音楽、STEP等の学びへの入口。準備中は準備中を明示する。
4. **P2** 買う・選ぶ: `オリジナルグッズ` と `商品レビュー` を別リンク・別カードにする。購入先を記事メディアと混同させない。PCではオリジナル商品のカードをやや広めにする。
5. **P3** その他のご案内: 教室について、マイページ、公式LINE/メール問い合わせ。低優先＝無価値ではない。既存会員のアクセスはメニューからも維持。

旧9サービス入口を失わせず、記事メディアを独立追加して10カードにする。内部事業部門の数、英語の管理用番号、技術的な管理状態を公衆向けUIで強調しない。

## 3. Booking state and communication contract

- 公式カレンダー「レッスン296」に掲載したクラスは **開講決定済み**。掲載クラスの開講自体が仮決定であるような文言は禁止。
- `OPEN` / 状態未指定：参加の申し込みが可能。空席確約ではない。
- `CLOSE`：クラスは開講するが **追加受付なし**。「満席」「休講」「中止」と言い換えない。
- **参加予約はスタジオから明示的な「予約確定」返信をLINEまたはメールで送った時点で成立**。入力、コピー、LINE起動、送信だけでは成立しない。
- 上記の条件は申込画面・メッセージ作成時に表示。クラス一覧やページ冒頭に同じ注意書きを大量反復しない。
- カードでは開催日時・クラス・講師・例外ステータス・詳細への入口を優先。通常の「受付中」「未連携」「更新日時」の反復を避ける。
- `開催情報を再読み込み` は **公開済みGitHub Pages JSONの再取得のみ**。Googleカレンダーを即時再同期しない。秘密鍵やActions起動APIをブラウザに露出しない。定期同期は既存の安全なジョブ。
- 過去枠を将来の「参加可能枠」と誤表示しない。状況が確認できない場合は事実を超えて空席を断定しない。

## 4. Copy deletion / preservation

- **削る**: 見れば分かる操作説明、同一画面で重複するCTA補足、内部開発語句、管理ログ、「将来更新します」の反復、通常時のステータスバッジ。
- **残す**: 初回体験・通常料金・TIPS/チャージ条件・対象・期間・持ち物・場所・アクセス・先生の違い・連絡先。これらを削ると比較判断できなくなる。
- **例外は残す**: 中止・CLOSE・確定満席・取得失敗・準備中・権利未確認・外部リンク切れなど利用者の選択を変える情報。
- **保護領域**: 予約/変更/キャンセル/返金、個人情報、支払い、撮影、著作権、講師登録、ワークショップ運営、外部RS Walletなど。法的説明や安全注意を単なる冗長文として削除しない。
- アクセシビリティ情報は視覚的に隠してもスクリーンリーダーやキーボードで使えるよう維持する。

## 5. Unified navigation source / consistency

- **UIで参照する正式な名称とURLはこのv2と `docs/03_NAVIGATION_REGISTRY.md` を同一内容で維持する。**
- 主要メニューにある「レッスン日程」は `/schedule/`、オリジナルグッズは商品一覧へ。前者のURL名 `schedule` は変更しない。
- `tools/navigation_sync.py`、`tools/navigation_audit.py`、`scripts/build_sites_migration.cjs` と `docs/sites-migration/source-shell.txt`、公開HTML、SPA動的HTMLを同期する。
- グローバル共通メニューの順番と全リンクの維持は `RS-NAV-2` の変更規則に従い、販売・記事・レッスン日程を誤分類しない。
- HTML `<h2>` はサービスグループ、`<h3>` は各カード。タップ領域は十分に確保し、複数リンクのヒット領域が重ならない。
- PC/スマホの共通メニューは同一の正本から生成し、表示差・リンク先Driftを禁止する。

## 6. Release gate

- 最新main/PR/保護ファイル境界/差分を先に確認する。
- 重要文言とリンクの契約テスト、生成結果のゼロ差分、ナビゲーションstrict、静的/JS両描画の整合を検証。
- 320/375/390/430/768/1440px、コンソール、画像、横スクロール、タップ、キーボード、戻る操作を検証。
- GitHub Pages `main` にPRで安全に統合し、公開デプロイ成功と実際のページを再確認。
- 変換率・売上等は実測データなしに改善を断定しない。採点は専門家による暫定評価と実測評価を分ける。
- クラス同期、ワークショップDB/Auth、個人情報、課金・外部ショップ/ブログの中身を変更しない。

## 7. Rule hierarchy and maintenance

1. `PROJECT_PROFILE.md`: identity, system boundary, protected areas.
2. `AI_OS_CREATION_RULES`: universal development/QA process.
3. `docs/ux/RS_WEB_UX_RULES_V2.md`: **canonical user-facing UX writing / naming / prioritization**.
4. `docs/03_NAVIGATION_REGISTRY.md`: actual menu destination/order contract.
5. Page-specific content/feature contracts and tests.

v1 documents are history/reference. Do not create another contradictory independent "copy rule"; edit v2 and synchronize associated tests when changing terminology or priority.

## 8. Next improvement backlog (not automatically part of this release)

- レッスン日程の長い一覧を直近優先で段階表示。
- 過去枠申込を防ぐ明示的な時間ガード。
- 新規利用者による3〜5件の課題完了テスト。
- 商品一覧URLの外部導線の定期確認。
