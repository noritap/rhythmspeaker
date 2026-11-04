# RHYTHM SPEAKER｜サイト横断 UX 初回台帳（2026-11-05）

- 状態: **SOURCE AUDIT / FIRST VC IN PROGRESS**。公開サイトの6画面幅の操作QA、スクリーンショット、実測CVは未完了。
- GitHub source: `noritap/rhythmspeaker` / main `79bad1b2b1f076d30fe458b20941a6ecb4317d5a`。
- Discovery: Git tree（recursive 566 entries）＋ `docs/seo/page-registry.json`（43 public HTML）＋ `docs/sites-migration/routes.json` ＋主なHTMLとJS導線。 
- UX authority: `PROJECT_PROFILE.md` > 正式公開コード/運営境界 > `docs/ux/RS_WEB_UX_RULES_V2.md` v2.1（v1 copy policyはSUPERSEDED）＋ `docs/03_NAVIGATION_REGISTRY.md` ＋既存の正式scorecard。
- **点数の解釈**: 未評価は点数の捏造を防ぐための明示的な未完了状態。料金96点は既存の改善案の設計評価であってCV実測ではない。STEP94点は今回の変更案に対する仮説上の設計評価であり、実機QA・公開を保証しない。
- 主要CTAはページの主行動（ページ固有＋必要なサイト共通導線）、問題欄は「観測済み」と「実機検証の仮説」を明確に区別する。

## 全43ページ｜ページ台帳

### 主要導線（11ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/` | 新規・既存｜教室を知る | 初回体験/レッスン日程 | 主目的は明確。複数CTAの優先順位・スマホ表示を再検証 | P1 | 一般 | サイト横断 | 未評価 |
| `/trial/` | 初心者｜体験内容を理解 | 体験申込へ | 説明とCTAの重複候補。必要条件は維持 | P1 | 一般 | 申込導線 | 未評価 |
| `/trial/apply/` | 初心者｜体験希望を伝える | LINE/メールで申込連絡 | 入力・送信・予約確定の誤認防止を確認 | P1 | 申込境界 | 申込導線 | 未評価 |
| `/schedule/` | 受講者｜予定/空き時間を選ぶ | 開催レッスン申込または開催相談 | 既存2モードの発見性・失敗状態を実機確認 | P1 | 予約・同期 | 予約UX | 未評価 |
| `/pricing/` | 新規・継続｜費用を比較 | 体験/日程/プラン相談 | v3反映済。金額・SPA整合・実測を継続監査 | P1 | 料金・TIPS | 料金v3 | 設計96/100（既存記録） |
| `/classes/` | 新規｜クラス選択 | クラス詳細/日程 | カード選択後の戻りやすさと説明密度を確認 | P1 | 一般 | サイト横断 | 未評価 |
| `/ecosystem/` | 全利用者｜目的から探す | 目的別サービスへ | 入口10件のカテゴリ・優先順位を実機で検証 | P2 | 一般 | ナビ監査 | 未評価 |
| `/faq/` | 初心者｜疑問を解決 | 関連案内/申込 | 他ページと重複する回答を精査 | P2 | 案内条件 | サイト横断 | 未評価 |
| `/about/` | 新規｜教室の特徴を知る | 体験内容へ | 主張と実際の体験への接続を確認 | P2 | 一般 | サイト横断 | 未評価 |
| `/access/` | 来店者｜到着する | 道順・アクセス確認 | 地図/道順/当日の見やすさを実機確認 | P2 | 住所・来店案内 | サイト横断 | 未評価 |
| `/rental/` | 利用検討者｜利用方式と料金を判断 | プラン別相談 | 長文かつ契約条件を含む。条件維持のまま段階表示を検討 | P2 | 契約・精算 | 利用導線 | 未評価 |

### クラス詳細（6ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/classes/step/` | 未経験者｜STEPのレベルを選ぶ | 体験申込/STEP日程 | 同一申込先7箇所・学習段階説明重複。今回4箇所へ整理 | P1 | 一般 | サイト横断＋本PR | 改善案94/100 |
| `/classes/tap/` | 経験者｜TAPのスタイルを知る | TAP日程/相談 | 日程リンク実装済。講師選択の操作を実機確認 | P2 | 一般 | サイト横断 | 未評価 |
| `/classes/stretch/` | 身体づくり希望｜体験を知る | 体験申込 | 同種申込CTAの表示密度を監査 | P2 | 一般 | サイト横断 | 未評価 |
| `/classes/isolation/` | 身体操作希望｜内容を知る | ISOLATION日程/相談 | 日程リンク実装済。申込との使い分けを実機確認 | P2 | 一般 | サイト横断 | 未評価 |
| `/classes/bar-method/` | 姿勢づくり希望｜内容を知る | BAR METHOD日程/相談 | 日程リンク実装済。条件と説明を監査 | P2 | 一般 | サイト横断 | 未評価 |
| `/classes/hiit/` | トレーニング希望｜強度を知る | HIIT日程/相談 | 運動強度の確認導線と日程リンクを監査 | P2 | 受講条件 | サイト横断 | 未評価 |

### 講師（7ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/instructors/` | 受講者｜講師を比較 | 講師詳細/日程 | 講師別選択と日程への移動を実機確認 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/furusho/` | 受講者｜指導特徴を知る | 担当日程/LINE | 講師名付き日程リンク実装済。導線重複を検証 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/homma/` | 受講者｜指導特徴を知る | 担当日程/LINE | 講師別LINEとスタジオLINEの用途を検証 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/mifa/` | 受講者｜指導特徴を知る | 担当日程/LINE | 講師別LINEとスタジオLINEの用途を検証 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/niu/` | 受講者｜指導特徴を知る | 担当日程/LINE | 日程リンク/講師紹介の整合を検証 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/okudaira/` | 受講者｜指導特徴を知る | 担当日程/LINE | 日程リンク/講師相談の整合を検証 | P2 | 連絡先 | サイト横断 | 未評価 |
| `/instructors/sasasa/` | 受講者｜指導特徴を知る | 担当日程/LINE | 日程リンク/講師相談の整合を検証 | P2 | 連絡先 | サイト横断 | 未評価 |

### イベント（2ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/workshops/` | 参加者｜ワークショップを選ぶ | 開催予定/詳細 | 独立予約系・進行中PRがあるため安全ゲートを優先 | P1 | 保護 | ワークショップ系 | 未評価 |
| `/workshops/sakaida-koji-20261122.html` | 参加者｜特定イベントを確認 | 正式受付ページへ | 静的記事からlive予約詳細へ渡す導線を検証 | P1 | 保護 | ワークショップ系 | 未評価 |

### 音楽（8ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/music/` | リスナー｜作品を発見 | 一覧/再生 | JS描画。初期HTMLのみでは視覚UXを採点不可 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/discover/` | リスナー｜作品を探す | フィルタ/詳細 | JS描画。絞込・空データを実機確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/listen/` | リスナー｜聴く | 視聴/再生 | JS描画。再生UIと戻る操作を実機確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/albums/` | リスナー｜アルバム一覧を見る | アルバム詳細 | JS描画。下層SPAルートを実機確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/albums/disco-001/` | リスナー｜アルバムを聴く | 再生/関連作品 | JS描画。個別ルート復元と視聴を確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/albums/saa-ittemiyouka/` | リスナー｜アルバムを聴く | 再生/関連作品 | JS描画。個別ルート復元と視聴を確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/albums/tap-dance-in-suspense/` | リスナー｜アルバムを聴く | 再生/関連作品 | JS描画。個別ルート復元と視聴を確認 | P2 | 権利・メディア | Music CI | 未評価 |
| `/music/albums/velvet-city-motion/` | リスナー｜アルバムを聴く | 再生/関連作品 | JS描画。個別ルート復元と視聴を確認 | P2 | 権利・メディア | Music CI | 未評価 |

### 放送・番組（6ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/broadcast/` | 視聴者｜番組を発見 | 番組/エピソード | 入口が複数。優先アクションを実機確認 | P2 | 権利・メディア | Broadcast CI | 未評価 |
| `/broadcast/programs/ayako-no-heya/` | 視聴者｜番組を知る | エピソードを視聴 | 章・過去回・出演者の情報順序を検証 | P2 | 権利・メディア | Broadcast CI | 未評価 |
| `/broadcast/episodes/ayako-000/` | 視聴者｜第0回を見る | 再生/次回 | メディア再生・章移動の操作を検証 | P3 | 権利・メディア | Broadcast CI | 未評価 |
| `/broadcast/episodes/ayako-001/` | 視聴者｜第1回を見る | 再生/次回 | メディア再生・章移動の操作を検証 | P3 | 権利・メディア | Broadcast CI | 未評価 |
| `/broadcast/episodes/ayako-002/` | 視聴者｜第2回を見る | 再生/次回 | メディア再生・章移動の操作を検証 | P3 | 権利・メディア | Broadcast CI | 未評価 |
| `/broadcast/episodes/ayako-003/` | 視聴者｜第3回を見る | 再生/次回 | リンク先・見どころ・視聴導線を検証 | P3 | 権利・メディア | Broadcast CI | 未評価 |

### 発表会・アーカイブ（3ページ）

| URL | 役割・利用者 | 主行動・CTA | コード監査上の課題 / 検証項目 | 優先 | 保護 | 関連テスト | UX/100 |
|---|---|---|---|---|---|---|---|
| `/rss/` | 視聴者｜RSSを発見 | 開催回/作品検索 | 開催回・作品検索はJS描画も含め検証 | P2 | 権利・出演者 | RSS系 | 未評価 |
| `/rss/014/` | 視聴者｜公式プログラムを見る | 作品/開催回 | 長いプログラムの情報階層・スマホ操作を検証 | P3 | 権利・出演者 | RSS系 | 未評価 |
| `/rss/015/` | 視聴者｜公式プログラムを見る | 本編動画/作品情報 | 本編動画と作品リストの接続を検証 | P2 | 権利・出演者 | RSS系 | 未評価 |

## 公開対象外／独立権限のあるHTML（10件）

| コード上のパス | 分類・理由 |
|---|---|
| `instructor-registration/index.html` | noindex: instructor profile intake |
| `instructor-submit/index.html` | noindex: instructor information submission |
| `rss-theater/index.html` | noindex: duplicate RSS preview; canonical official page is /rss/ |
| `rss-theater/qa/index.html` | noindex: internal responsive QA |
| `rss-theater/qa/program.html` | noindex: internal program QA |
| `ui-style-catalog/index.html` | noindex: internal design catalog |
| `workshops/admin/index.html` | noindex: authenticated operations |
| `workshops/event.html` | dynamic: query-driven event detail, no canonical stable slug inventory |
| `workshops/instructor/edit.html` | noindex: instructor edit / authorization |
| `workshops/instructor/index.html` | noindex: token-gated instructor view |

※ `workshops/event.html` はクエリ依存の動的公開詳細として、一般的な固定ページとは別の安全QAを要する。noindexを認証・秘匿と誤認しない。対象外ページは権限・URL・データ流出がないか独立監査する。

## 初回VC｜STEP重複圧縮（変更は開発ブランチのみ）

- Evidence: `classes/step/index.html` にSTEP体験申込先が7箇所。レベル選択後／講師紹介後／STEP→TAP案内に同じ操作を反復。基礎の3段階解説とレベル説明も重複。
- Candidate: 重複CTA3箇所、重複する基礎段階セクション1箇所を削減。4箇所（ヘッダー、ヒーロー、申込方法、最後）を維持。料金・初回体験条件・LINE・日程絞込・予約確定条件・講師リンク・各アンカーを保護。
- Design score (hypothesis): 顧客価値24/25、CV18/20、正本再利用14/15、安全14/15、保守14/15、テスト10/10 → **94/100**。効果の実測を意味しない。
- Negative option: 申込CTAを1箇所だけにする案は、長いモバイルページで見失う危険があり不採用。予約確定条件や初回体験料金の削除も不採用。
- Regression contract: `tools/test_sitewide_journey_ux.cjs` にCTA箇所数、#アンカー、日程絞込、TAP遷移、予約確定注意の保持を追加。
- Security: workshop, Wallet, pricing master, paid operations, protected blobs, authentication, calendar syncは変更しない。

## QA / Release Gate

1. 既存の`Sitewide Journey UX Contract`、ナビ・画像・ページ台帳関連CI、リンク検証の結果を確認する。
2. 320 / 375 / 390 / 430 / 768 / 1440pxでSTEP表示、クリック、キーボード、axe WCAG 2.1 AA、横スクロール、画像、JS consoleを実ブラウザで検証し、比較スクリーンショットを記録する。
3. 公開後はPagesの実画面と申込画面（送信・予約確定は実行しない）を再確認する。CIのみでの本番完了宣言は禁止。
4. 次の優先対象: `/trial/apply/` の状態説明→`/schedule/` の二つの利用目的の発見性→`/classes/stretch/` の同種CTA整理。ただし実測エラーが見つかればP0を先行する。

## 指標

- 主指標: STEP詳細→STEP体験申込到達率、STEP詳細→STEP開催予定到達率。
- 補助指標: 申込フォーム中断、モバイル操作エラー。クリック数と予約成立数を混同しない。
- 現時点: 数値の測定基盤・実測効果は未確認。
