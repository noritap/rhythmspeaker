/**
 * Rhythm Speaker instructor intake: run createInstructorForm() once in
 * script.google.com while signed in to the studio-owned Google account.
 * Do not publish edit URL, spreadsheet URL or responses in a public repo.
 */
function createInstructorForm() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('RS_INSTRUCTOR_FORM_ID')) {
    throw new Error('Existing form recorded. Open it instead of creating a duplicate.');
  }
  const form = FormApp.create('Rhythm Speaker｜講師プロフィール登録');
  form.setDescription('講師プロフィールの確認・掲載準備のために収集します。提出内容は管理者が確認し、承認した公開項目のみ公式HPに掲載します。連絡先メールアドレスは非公開です。写真はこのフォームでは収集しません。');
  form.setConfirmationMessage('送信ありがとうございます。管理者が内容を確認し、必要に応じて連絡します。送信だけでは公式HPに公開されません。');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(false);
  form.setPublishingSummary(false);

  const requiredText = (title) => form.addTextItem().setTitle(title).setRequired(true);
  const requiredPara = (title) => form.addParagraphTextItem().setTitle(title).setRequired(true);
  const optionalText = (title) => form.addTextItem().setTitle(title).setRequired(false);
  const checkbox = (title, choices) => form.addCheckboxItem().setTitle(title).setChoiceValues(choices).setRequired(true);

  requiredText('公開する講師名');
  requiredText('ふりがな');
  const email = form.addTextItem().setTitle('連絡用メールアドレス（非公開）').setRequired(true);
  email.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  checkbox('担当クラス', ['STEP', 'TAP', 'STRETCH', 'ISOLATION', 'BAR METHOD', 'HIIT', 'その他']);
  checkbox('得意な指導分野', ['基礎', 'リズム・音楽性', '身体の使い方', '振付・表現力', 'テクニック向上']);
  checkbox('おすすめしたい生徒', ['初めての方', '運動が苦手な方', '基礎を深めたい方', '経験者']);
  requiredPara('初心者への指導方針');
  requiredPara('レッスンで大切にしていること');
  requiredPara('これまでのダンス経験');
  requiredPara('生徒へのメッセージ');
  optionalText('紹介動画のURL（任意）');
  form.addParagraphTextItem().setTitle('その他の実績・掲載希望事項（任意）').setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle('公開同意（必須）')
    .setChoiceValues(['記載内容を管理者が確認し、承認した公開用情報のみ公式HPへ掲載することに同意します'])
    .setRequired(true);

  const sheet = SpreadsheetApp.create('Rhythm Speaker｜講師登録回答（非公開）');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  props.setProperty('RS_INSTRUCTOR_FORM_ID', form.getId());
  props.setProperty('RS_INSTRUCTOR_SHEET_ID', sheet.getId());
  Logger.log('回答者用URL（公式HP設定用）: ' + form.getPublishedUrl());
  Logger.log('管理者編集URL（非公開）: ' + form.getEditUrl());
  Logger.log('回答スプレッドシートURL（非公開）: ' + sheet.getUrl());
}
