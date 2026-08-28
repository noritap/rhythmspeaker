# PROJECT_PROFILE

Version: 3.2
Status: ACTIVE
Project: Rhythm Speaker Web

━━━━━━━━━━━━━━━━━━━━
# 1. PROJECT IDENTITY
━━━━━━━━━━━━━━━━━━━━

Project Name:
Rhythm Speaker Web

Japanese / Public Context:
【WEB連動型】タップダンス教室 リズムスピーカー 公式Web

Project Purpose:
【WEB連動型】タップダンス教室 リズムスピーカーの新規顧客向け公式Webを構築・運用し、
初心者の理解促進、不安解消、検索流入、ブランド理解、初回体験予約へのコンバージョンを担う。

このProjectは、単なる店舗紹介ページではない。
検索 / YouTube / SNS等から流入した新規ユーザーを、
Rhythm Speakerの理解 → 初心者不安の解消 → LINEによる初回体験予約へ導く
Customer Acquisition / Conversion Web Projectとして扱う。

Project Type:
- Official Website
- Marketing Website
- Conversion Landing Page
- Local SEO / Search Asset
- Multi-page Content Website
- Customer Acquisition Funnel
- Static Website

Primary User:
Rhythm Speaker / 古庄里好 / Noritaka Furusho

Primary Target User:
- タップダンス完全初心者
- 年齢・体力に不安がある人
- 運動経験が少ない人
- 30代・40代以降で新しい趣味を探している人
- リズム感に自信がない人
- 大人数レッスンに不安がある人

━━━━━━━━━━━━━━━━━━━━
# 2. PRIMARY REPOSITORY
━━━━━━━━━━━━━━━━━━━━

Primary Repository:
noritap/rhythmspeaker

Default Branch:
main

Repository Strategy:
Single Project Repository with isolated preview subtree

Canonical Profile Path:
/PROJECT_PROFILE.md

Primary Project Area:
Repository root全体

Production Branch:
main

Production Hosting:
GitHub Pages

Production URL:
https://noritap.github.io/rhythmspeaker/

Repository Role:
Rhythm Speaker公式Webの新規顧客向け導線、SEO、ブランド理解、体験予約CV、情報ページ群を管理する。

`/workshops/` は同一Repository内の isolated preview subtree として扱う。
Official Web本体とWorkshop Managerの運用境界を混同しない。

このRepositoryは、RS Wallet本体、STORESの商品販売機能を実装する場所ではない。
Workshop Managerについても、公開Preview / demo UIは保持できるが、
live予約DB、認証、決済自動化をOfficial Web本体の標準機能として扱わない。

━━━━━━━━━━━━━━━━━━━━
# 3. SOURCE OF TRUTH
━━━━━━━━━━━━━━━━━━━━

WHAT PROJECT IS THIS:
本PROJECT_PROFILE.md

CURRENT REAL STATE:
GitHub Repository
noritap/rhythmspeaker

Repository Entry Point:
README.md

Current Code / Docs / Implementation:
GitHub main branch

Current Unmerged Development:
対象feature branch / Pull Request

HOW TO BUILD:
noritap/AI_OS_CREATION_RULES

Project-specific Development Rules:
- README.md
- docs/01_OFFICIAL_HP_PHASE1_PLAN.md
- docs/02_CONVERSION_MEASUREMENT_BASELINE.md
- workshops/README.md

WHAT THE USER WANTS NOW:
Current Conversation

Supporting Sources:
- Current official LP / index.html
- Current page-specific HTML / CSS
- `/rss/`
- `/workshops/` preview subtree
- GitHub Pull Requests
- GitHub Pages production state
- Verified business information supplied by the user

Source Priority:
1. PROJECT_PROFILE.md = Project Identity / Boundary / Priority
2. GitHub main = Current production code / docs / structure
3. Active PR / feature branch = Current unmerged development state
4. README.md / docs / workshops/README.md = Project-specific design and operating rules
5. AI_OS_CREATION_RULES = Generic development methodology
6. Current Conversation = Current user intent

━━━━━━━━━━━━━━━━━━━━
# 4. PLATFORM / SYSTEM BOUNDARY
━━━━━━━━━━━━━━━━━━━━

GitHub Official Web:
Role:
- 集客
- 初心者向け説明
- ブランド理解
- 検索流入
- クラス / 体験 / アクセス / FAQ等の説明
- LINEへの送客
- メディア / SEO資産化

Workshop Manager Preview:
Path:
/workshops/

Role:
- ワークショップ公開ページのPreview
- スマホ管理UIのPreview
- イベント作成 / 編集 / 予約導線の検証
- demoデータによる運用設計確認

Current Runtime Boundary:
- `workshops/config.js` の `mode` は `demo`
- demoではブラウザ localStorageを使用
- 端末間共有なし
- Supabase live DB / Auth / Storageは未接続
- live決済自動化は未接続

Workshop Manager Live Gate:
以下は別のArchitecture / Security Gateとして扱い、明示承認なしに有効化しない。
- `mode: "live"` への切替
- Supabase URL / Publishable Key設定
- Supabase Auth本番運用
- 予約者個人データの本番保存
- Stripe Checkout / Webhook
- 本番決済状態の自動更新
- Secrets / Service Role KeyのRepository保存

Live化する場合は、専用App / Repository分離を含めて再評価する。

STORES:
Role:
- SHOP
- 商品販売

STORESを本Repositoryへ無理に統合しない。

Official LINE:
Role:
- 初回体験予約
- 問い合わせ
- 個別相談
- コンバージョン

Primary CTA Destination:
Official LINE

RS Wallet:
Role:
- 認証
- TIPS残高確認
- TIPS利用
- 取引 / 利用履歴確認
- 継続利用時のサービス利用

RS Walletは、新規顧客向けPrimary CTAにしない。
予約・決済・デジタルチケット管理等の機能を、確認なしに断定しない。

Platform Funnel:

検索 / YouTube / SNS
↓
GitHub Official Web
↓
Rhythm Speakerを理解
↓
初心者不安を解消
↓
Official LINE
↓
初回体験
↓
継続利用
↓
RS Wallet / TIPS

Workshop Funnelは上記Primary Funnelと分離して扱う。

━━━━━━━━━━━━━━━━━━━━
# 5. CTA ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━

Primary CTA:
初回体験を予約する

Destination:
Official LINE

Secondary CTA:
ページ文脈ごとに原則1つまで。

Examples:
- クラスを見る
- 体験の詳細を見る
- アクセスを見る
- よくある質問を見る

Supporting CTA:
RS Wallet

Rule:
RS Walletを、体験前に登録必須であるように見せない。

Workshop CTA:
Workshop Manager配下の予約・支払導線はPrimary CTA Architectureとは別管理とし、
Official Web全体の体験予約CTAへ無断で置換しない。

━━━━━━━━━━━━━━━━━━━━
# 6. PROJECT-SPECIFIC DO NOT TOUCH
━━━━━━━━━━━━━━━━━━━━

以下は、必要性確認・差分確認・適切なレビューなしに変更しない。

- mainへの大規模直接変更
- 現在機能している初心者Conversion Funnelの破壊
- Primary LINE CTAの役割変更
- 既存 `/` のURL移動
- index.htmlの全面再構成
- React / Next.js / Astro等への全面移行
- CMS導入
- 大規模CSSリファクタ
- STORESの役割を本サイトへ統合
- RS Wallet機能の推測による拡張記載
- 未確認の料金 / TIPS / クラス / 講師 / アクセス / 営業情報の掲載
- 画像・ファイルの即時削除
- 既存Production導線の破壊
- Secrets / API Key / Token / .envの保存
- External Repositoryへの無断WRITE
- Workshop Managerのdemo → live切替
- Workshop Managerへの本番Supabase認証 / 個人情報保存の無断導入
- Stripe / Webhook等の本番決済自動化の無断導入

静的HTML / CSSで目的を達成できるOfficial Web領域では、不要なフレームワーク移行を行わない。

━━━━━━━━━━━━━━━━━━━━
# 7. BUSINESS DATA SAFETY
━━━━━━━━━━━━━━━━━━━━

以下は、実装・変更前に最新の事業情報と照合する。

- 初回体験料金
- 入会金
- TIPS仕様
- クラス名
- クラス時間
- 講師情報
- LINE導線
- アクセス
- 無料レンタル条件
- スケジュール
- 営業時間
- RS Wallet機能説明
- Workshop料金 / 定員 / 開催日時 / 支払条件

Confirmed Current Business Facts:
- 初回体験: ¥1,000
- 入会金: 0円
- タップシューズ無料レンタル
- ウェア無料レンタル
- 池袋駅徒歩3分
- 体験レッスン: 60分
- 来店目安: 15分前
- 初心者向けクラス: STEP 超初級
- 初心者向けクラス: STEP 初級
- 古庄里好: 週27本レッスン担当経験あり

LINE:
体験予約系CTAは、スマホ実機でprefill動作を確認したURL形式を主要ページへ展開済み。
一般相談用途のLINEリンクは体験予約文を強制しない。

━━━━━━━━━━━━━━━━━━━━
# 8. DESIGN / UX POLICY
━━━━━━━━━━━━━━━━━━━━

Core Principles:
- Mobile First
- CTA First
- Low Cognitive Load
- Beginner First
- Accessibility

Visual Direction:
- 木のタップフロア
- 黒 / 白 / ダークトーン
- タップシューズ / 足元
- リズム
- ベクトル
- 足跡
- 余白による情報整理

Avoid:
- 子ども向けダンススクール風
- 過剰なストリート表現
- 値引き中心の安売り表現
- 情報過多
- 過剰装飾
- 1画面に大量の選択肢

Mobile Requirements:
- 横スクロールを出さない
- CTAを重ねない
- 文字サイズを破綻させない
- カードは必要に応じて1カラム化
- 固定ボタンが操作を妨げない
- Primary CTAを押しやすく維持する

Image Policy:
- Rhythm Speaker実景素材を最優先
- 実物のレンタルシューズ / ウェア等、安心材料になる写真を優先
- 汎用ストック素材は補助用途に限定

━━━━━━━━━━━━━━━━━━━━
# 9. TECHNICAL ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━

Official Web Current Stack:
- HTML
- CSS
- Small client-side JavaScript
- GitHub
- GitHub Pages
- Google Fonts
- Lucide Icons

Official Web Architecture Policy:
Static HTML / CSS First

Do Not Prematurely Introduce to Official Web:
- React
- Next.js
- Astro
- CMS
- Build System
- Heavy Component Framework

Workshop Manager Preview Stack:
- Static HTML / CSS / JavaScript
- localStorage demo mode
- Supabase client library included for future live mode
- GitHub Pages preview

Workshop ManagerはOfficial Webと同じRepositoryに存在しても、
Runtime / Data / Auth / Payment Boundaryは分離する。

技術的高度化を、ユーザー価値・CV・事業成果より優先しない。

━━━━━━━━━━━━━━━━━━━━
# 10. SEO / CONTENT STRATEGY
━━━━━━━━━━━━━━━━━━━━

SEO Principle:
ページごとに検索意図を分離し、
初心者向けLPへ情報を無限に積み上げない。

Primary Search Intent:

/:
- タップダンス教室 池袋
- タップダンス 初心者 池袋
- 大人 タップダンス 東京

/trial/:
- タップダンス 体験 池袋
- タップダンス 初心者 体験 東京

/classes/:
- タップダンス クラス 池袋
- 初心者 タップダンス レッスン 東京

/access/:
- タップダンス 池袋駅
- タップダンス教室 豊島区

/about/:
- Rhythm Speaker
- リズムスピーカー タップダンス

/faq/:
- 50代 タップダンス
- 60代 タップダンス
- タップダンス 初心者 不安
- タップシューズ レンタル

/rss/:
- Rhythm Speaker Show
- Rhythm Speaker RSS

Current SEO Baseline:
- canonical metadata
- sitemap.xml
- robots.txt
- sitemap lastmod
- LocalBusiness / Breadcrumb structured data on access page

SEO Status:
DESIGN / HYPOTHESIS + PARTIAL IMPLEMENTATION

Search Console等の実データが得られた場合は、
検索意図・title・description・ページ優先度を更新する。

━━━━━━━━━━━━━━━━━━━━
# 11. PROJECT PRIORITIES
━━━━━━━━━━━━━━━━━━━━

1. 新規顧客がRhythm Speakerを理解できること
2. 初回体験予約CV
3. 初心者不安の解消
4. Business Dataの正確性
5. Official LINEへのConversion導線維持
6. Mobile UX
7. Conversion measurement
8. Local SEO / Search Asset化
9. 既存 `/` Production LPの安全維持
10. Multi-page化による情報分離
11. 運用・更新しやすさ
12. Accessibility
13. 構造整理
14. 技術的高度化

Workshop Managerは別価値ストリームとして扱い、
Official WebのPrimary Funnelを壊さない範囲で進める。

Priority Rule:
構造美・コード美・技術的新しさを、事業成果より優先しない。

━━━━━━━━━━━━━━━━━━━━
# 12. DEVELOPMENT STATE
━━━━━━━━━━━━━━━━━━━━

Current Development Phase:
Production + Phase 1 Optimization + Isolated Workshop Preview

Current Goal:
公開済みのPhase 1ページ群と既存初心者LPを維持しながら、
モバイル導線、実画面品質、検索資産、計測基盤、運用性を継続的に最適化する。

Current Milestone:
Official HP Phase 1 Stabilization

Phase 1 Production Page Set:
- /
- /trial/
- /classes/
- /access/
- /about/
- /faq/

Additional Published Content:
- /rss/

Isolated Preview:
- /workshops/
- /workshops/event.html?slug=...
- /workshops/admin/

Workshop Preview Status:
- demo mode
- localStorage
- Supabase live未接続
- live Auth / reservation DB / payment automation未稼働

Phase 1 Principle:
現在の `/` を初心者向けCVページとして維持し、
高価値ページを追加して役割分担する。

Do Not:
- `/` を `/beginner/` へ移動しない
- トップページをPhase 1で全面再設計しない
- ページ数を一気に増やしすぎない

━━━━━━━━━━━━━━━━━━━━
# 13. CURRENT PRODUCTION CAPABILITIES
━━━━━━━━━━━━━━━━━━━━

Official Web Production:
- Beginner LP
- /trial/
- /classes/
- /access/
- /about/
- /faq/
- /rss/
- Common PC / mobile navigation
- Back-to-top
- Explicit STORES navigation / footer links
- LINE trial prefill on trial-booking CTAs
- Rental proof photos on trial page
- GitHub Pages
- SEO crawl baseline
- LocalBusiness structured data on /access/
- Conversion Measurement Baseline specification

Published Preview / Not Live Operations:
- /workshops/
- Workshop Manager demo/admin UI

Current Development:
- Phase 1 production optimization
- Mobile UX validation
- SEO refinement
- conversion measurement implementation planning
- Workshop Manager preview validation

Future Scope / Not Phase 1:
- /beginner/
- /classes/step/
- /classes/tap/
- /classes/gvc/
- /instructors/
- /schedule/
- /price/
- /wallet/
- /dance-park/
- /rental/
- /tap-hub/
- /media/
- /shop/
- /contact/

Operational Note:
個別PR番号、branch名、latest commit SHA、今日の作業状況は
PROJECT_PROFILEへ固定しない。
Current Development StateはGitHub実体で確認する。

━━━━━━━━━━━━━━━━━━━━
# 14. RELEASE / VALIDATION
━━━━━━━━━━━━━━━━━━━━

Standard Release Flow:

main
↓
feature branch
↓
implementation
↓
PC check
↓
SP check
↓
GitHub diff check
↓
Pull Request
↓
main merge
↓
GitHub Pages
↓
Public URL validation

PC Minimum Check:
- HERO
- Navigation
- CTA
- Sections
- Footer
- External links

SP Minimum Check:
- No horizontal overflow
- CTA not overlapping
- Typography readable
- Cards readable in one column where needed
- Fixed controls do not block interaction

External Link Check:
- LINE
- STORES
- RS Wallet
- Google Maps
- YouTube
- SNS

Workshop Preview Check:
- DEMO MODE表示
- localStorage前提が明確
- 本番個人データを入力させない
- live設定値が空であること

Production Validation Order:
1. main commit確認
2. GitHub Pages設定確認
3. 実公開URL確認
4. 対象機能を実操作

GitHub Actions表示だけで公開成否を断定しない。

━━━━━━━━━━━━━━━━━━━━
# 15. REPOSITORY BOUNDARY
━━━━━━━━━━━━━━━━━━━━

Primary WRITE Repository:
noritap/rhythmspeaker

Primary WRITE Area:
- Rhythm Speaker Official Web
- `/workshops/` demo / preview subtree

Workshop WRITE Boundary:
- demo / preview改善は本Repositoryで可能
- live Auth / DB / Payment activationは別承認・別Architecture Gate
- 専用App / Repository分離が必要かlive化前に再評価

From Revenue Strategy Project:
Permission:
READ / PROPOSE

WRITE:
Explicit authorization required

External Systems / Repositories:
- STORES
- RS Wallet / tips-app
- RS Studio OS
- Official LINE
- YouTube
- Instagram
- Google Maps
- AI_OS_CREATION_RULES
- Supabase live project for Workshop Manager（未確定）

External WRITE:
ユーザーの明示承認なしに行わない。

━━━━━━━━━━━━━━━━━━━━
# 16. UNKNOWNS
━━━━━━━━━━━━━━━━━━━━

以下は現時点でUNKNOWNまたは未確定。

- 独自ドメイン導入時期
- GitHub Pagesを長期Production Hostingとして維持するか
- /schedule/ の正本データSource
- クラス情報の長期管理方法
- Instructor情報の長期正本
- Price / TIPS情報のWeb更新Source
- Search Console導入状況 / KPI
- GA4等Analytics導入状況 / Measurement ID
- Production `line_cta_click` tracking導入時期
- Phase 1完了後のKPI基準
- CMS導入判断条件
- Custom Domain候補
- Workshop Manager live化時の専用Repository / Hosting方針
- Workshop Manager専用Supabase Project
- Workshop Managerの本番Auth / Privacy / Payment運用

UNKNOWNは推測で埋めない。

━━━━━━━━━━━━━━━━━━━━
# 17. PROFILE EXCLUDED / OPERATIONAL DATA
━━━━━━━━━━━━━━━━━━━━

以下は原則としてPROJECT_PROFILEへ蓄積しない。

- latest commit SHA
- PR番号
- feature branch名
- 今日の作業
- 一時的TODO
- 個別Bug
- 一時的なCSS修正
- 一時的コピー修正
- build ID
- GitHub Pages一時障害
- 一時的Handoff
- 単発のQA結果

これらはGitHub、Issue、Pull Request、HANDOFF、Current Conversationで管理する。

━━━━━━━━━━━━━━━━━━━━
# 18. DONE CONDITION
━━━━━━━━━━━━━━━━━━━━

このProject Profileが有効に機能している状態:

- Rhythm Speaker WebのIdentityが一意
- Primary Repositoryが明確
- Canonical Profile Pathが明確
- Production branchが明確
- GitHub Official Web / LINE / STORES / RS Walletの役割が分離されている
- Workshop Manager Previewとlive operationsの境界が明確
- Primary CTAが明確
- Business Data Safetyが明確
- Do Not Touchが明確
- Mobile / UX方針が明確
- Static HTML / CSS First方針が明確
- Multi-page Phase 1が明確
- Current ProductionとCurrent DevelopmentをGitHubで再確認できる
- External Repository / System Boundaryが明確
- UNKNOWNを推測で埋めない
- Current ConversationだけでProject Identityを変更しない

━━━━━━━━━━━━━━━━━━━━
# 19. FINAL PROJECT LOCK
━━━━━━━━━━━━━━━━━━━━

Rhythm Speaker Webは、
【WEB連動型】タップダンス教室 リズムスピーカーの
新規顧客獲得・初心者理解・検索流入・体験予約CVを担う公式Web Projectである。

このProjectはRS Wallet、STORES、Studio Operationの代替ではない。

公式Webは、
DISCOVER / UNDERSTAND / REDUCE ANXIETY / CONVERT
を担当する。

LINEは、
BOOK / CONTACT / CONVERT
を担当する。

STORESは、
BUY
を担当する。

RS Walletは、
AUTH / TIPS / USE
を担当する。

Workshop Managerは、
現時点では同一Repository内のISOLATED DEMO / PREVIEWであり、
Official Web本体のlive予約・認証・決済基盤とはみなさない。

Workshop Managerをlive化する場合は、
DATA / AUTH / PRIVACY / PAYMENT / HOSTING / REPOSITORY境界を再評価してから進める。

既存Production Funnelを守りながら、
Official WebはStatic HTML / CSSを基盤に段階的にVersion Upgradeする。
