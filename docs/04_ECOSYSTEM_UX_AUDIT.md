# Rhythm Speaker Ecosystem UX Audit v1

Status: IMPLEMENTATION INPUT
Scope: `/ecosystem/`
Date: 2026-09-18

## 1. Purpose

`/ecosystem/` を Rhythm Speaker 全体の Service Directory / Terminal として運用するため、現行UI v2を「見た目」ではなく、目的発見・到達・復帰のUXで監査する。

この監査では、既存の初心者向けTrial Conversion Funnelを壊さず、Public 7-category IA（STUDIO / WATCH / MUSIC / EVENTS / LEARN / SHOP / ABOUT）の発見性を高めることを優先する。

## 2. Current strengths

現行実装で維持するもの:

- 7カテゴリの情報設計
- Heroの「目的から探す」方針
- Category jump navigation
- Category icon system
- 2-column desktop / 1-column mobile card layout
- STUDIO内のTrial / Classes / Rental / RS Walletの役割分離
- WATCHからBroadcast / RSS / YouTubeへのRouting
- MUSICからOfficial LabelへのRouting
- EVENTSからWorkshopsへのRouting
- Primary Trial CTAをOfficial LINE系導線として維持する方針

## 3. UX findings

### P0: Public pageに内部運営ルールが露出している

現行末尾の `eco-note` は、内部10部門、Primary Owner、公開7カテゴリ、独立HP作成ルール、Primary CTA governanceを説明している。

これは運営・AI・開発者には重要だが、一般利用者がサービスを探すための情報ではない。

Decision:
- Public UIから削除する。
- GovernanceはREADME / PROJECT_PROFILE / docs側で保持する。

Expected effect:
- 認知負荷低減
- 「サービス一覧」ページとしての完成度向上
- 内部用語の露出削減

### P0: ABOUTの説明と実際のカードが一致していない

ABOUT headerは「ブランド、運営者、場所、FAQ、関連活動の入口」と説明しているが、カードは「教室紹介」「古庄里好 Official」の2件のみ。

`/access/` と `/faq/` はPrimary Pageとして存在するため、ABOUTから直接到達できるべき。

Decision:
- ABOUTへ `アクセス` cardを追加する。
- ABOUTへ `よくある質問` cardを追加する。

Expected effect:
- 説明と実装のsemantic consistency改善
- Service Directoryとしての網羅性改善
- 初回客の不安解消導線短縮

### P1: Hero copyに開発状態の説明が混ざっている

現行:
`利用できる入口から順に拡張します。`

これは利用者の目的達成より、サイト開発状態を説明する文言になっている。

Decision:
利用者中心の説明へ変更する。

Recommended copy:
`レッスンだけでなく、スタジオ、映像、音楽、イベント、学び、商品まで。やりたいことに合わせて、Rhythm Speakerのサービスを探せます。`

### P1: Internal / operator languageが一部Public copyに残る

例:
- `Music OSでカタログ、権利情報、公開状態を管理し...`
- `SHOPではなく、利用中の方向けMember Utilityとして扱います。`
- `公開可能な内容から順にOfficial Web内へ整理していきます。`
- `STORESはMain HPではなくSHOP / Commerce専用です。`

情報自体は正しいが、Service Directoryの利用者には運営設計の説明が過剰。

Decision:
- 役割の違いは残す。
- Repository / OS / governance vocabularyはPublic copyから減らす。
- 「何ができるか」「誰向けか」「押すとどこへ行くか」を優先する。

### P1: External destinationの予測可能性を統一する

外部リンクは `target=_blank` が多いが、古庄里好 Officialは同一タブ遷移。

Decision:
- External site routing policyを統一する。
- 新規タブにする場合は視覚/aria上も外部遷移を予測可能にする。
- Navigation Registryとの整合を壊さない。

## 4. Minimum Fix v1

次回実装は大規模リデザインではなく以下に限定する。

1. Public `eco-note` を削除
2. ABOUTへ Access card追加
3. ABOUTへ FAQ card追加
4. Hero copyを利用者中心へ変更
5. Public card copyから内部OS / governance用語を整理
6. External link behaviorを監査・統一

## 5. Do not change in this cycle

- Public 7-category IA
- Global Navigation Contract
- Trial pricing
- TIPS specification
- RS Wallet implementation
- Payment / auth / production data
- Site framework
- Global CSS architecture
- Top page conversion structure

## 6. Verification gate

Implementation後に最低限確認する。

- Navigation audit PASS
- Existing internal links resolve
- `/ecosystem/#studio` through `#about` anchor routing
- Mobile horizontal category navigation remains usable
- ABOUTから `/access/` と `/faq/` へ到達可能
- Trial CTA / Trial page routing unchanged
- No internal governance note remains in Public UI
- GitHub main merge後にpublic URLを確認

## 7. Browser verification status

2026-09-18時点、この実行環境ではGitHub Pages public URLの直接browser verificationが利用できなかったため、本監査v1はCurrent GitHub `main` のHTML sourceをSource of Truthとして実施した。

従ってvisual spacing / viewport overflow / real-device interactionは、実装PR後のbrowserまたは実機確認Gateとして残す。

## 8. Decision

Current UI v2はKEEPする。

次の価値は新しい装飾追加ではなく、Public copyから内部都合を取り除き、ABOUTの欠落導線を補完して、Service Directoryとしてのsemantic consistencyを上げることにある。
