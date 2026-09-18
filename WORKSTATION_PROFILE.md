# FURUSHO WORKSTATION PROFILE

## Purpose

古庄のMacをAIが運用・開発支援するときに参照するローカル環境のSource of Truth。
ローカルパスを推測せず、本ファイルに記録された既知の環境情報を優先する。

## Mac

- User home: `/Users/furushonoritaka`

## Standard Download Directory

- Default: `~/Downloads`
- Absolute: `/Users/furushonoritaka/Downloads`

### Rules

1. ブラウザ・ChatGPT等から通常ダウンロードしたファイルは、特別な指定がない限り `~/Downloads` を第一候補とする。
2. ユーザーが「ダウンロードした」「保存した」と伝えた場合、まず実ファイルの存在を `ls` / `find` 等で確認する。
3. `/path/to/...` のような説明用仮パスを、そのまま実行コマンドとして提示しない。
4. ファイルの存在確認前に `cp` / `mv` の実行を前提としない。

## Main Repository

### Rhythm Speaker

- Local: `/Users/furushonoritaka/Documents/rhythmspeaker`
- GitHub: `noritap/rhythmspeaker`
- Production branch: `main`

## Known Media Working Directory

- RS Photo Discovery: `/Users/furushonoritaka/Desktop/RS_PHOTO_DISCOVERY`

## Git / AI Operation Rules

1. GitHubへの変更は原則として作業branchを作成してから行う。
2. `main` へ直接書き込まない。
3. unrelatedなuntracked fileには触れない。
4. ローカルファイルをrepoへ移す場合、sourceとdestinationの実在を確認してから操作する。
5. PC環境・標準保存先・主要repoの場所が変更された場合、本ファイルを更新する。
6. AIはローカルファイル操作を案内する前に、このProfileの既知情報を優先する。

## Information Management Principle

繰り返し説明が必要になる安定した運用情報は、会話履歴だけに依存させずGitHub上のSource of Truthへ昇格させる。

分類の基本:

- `WORKSTATION_PROFILE.md`: PC環境・標準ディレクトリ・ローカルパス
- `PROJECT_PROFILE.md`: プロジェクト目的・構造・主要仕様
- Media Library: 写真・映像資産、用途、承認状態、参照先
- UI / Business / AI OS rules: 各専門領域の運用規約

## Security

パスワード、API key、認証token、個人の秘密情報などのcredentialは本ファイルへ保存しない。
