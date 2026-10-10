/**
 * Rhythm Speaker instructor intake: run createInstructorForm() once in
 * script.google.com while signed in to the studio-owned Google account.
 * Do not publish edit URL, spreadsheet URL or responses in a public repo.
 */
function createInstructorForm() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error('Creation already running. Wait and inspect existing files.');
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('RS_INSTRUCTOR_FORM_ID') || props.getProperty('RS_INSTRUCTOR_SHEET_ID') || props.getProperty('RS_INSTRUCTOR_SETUP_STATE')) {
      throw new Error('Existing or incomplete setup recorded. Inspect the recorded IDs privately; do not rerun or clear properties blindly.');
    }
    props.setProperty('RS_INSTRUCTOR_SETUP_STATE', 'CREATING');
    const form = FormApp.create('Rhythm Speaker｜講師プロフィール登録');
    props.setProperty('RS_INSTRUCTOR_FORM_ID', form.getId());
    form.setAcceptingResponses(false);
    form.setCustomClosedFormMessage('講師プロフィール登録は受付準備中です。管理者の案内をお待ちください。');
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

    form.addSectionHeaderItem().setTitle('1｜基本情報').setHelpText('メールアドレス以外は、管理者の承認後に公開する項目です。');
    requiredText('公開する講師名').setHelpText('公式HPに掲載する表記で入力してください。');
    requiredText('ふりがな');
    const email = form.addTextItem().setTitle('連絡用メールアドレス（非公開）').setRequired(true);
    email.setHelpText('確認・修正の連絡に使用します。公式HPには掲載しません。');
    email.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
    form.addSectionHeaderItem().setTitle('2｜指導情報').setHelpText('選択項目は複数選べます。文章は短い箇条書きでも構いません。');
    checkbox('担当クラス', ['STEP', 'TAP', 'STRETCH', 'ISOLATION', 'BAR METHOD', 'HIIT', 'その他']);
    checkbox('得意な指導分野', ['基礎', 'リズム・音楽性', '身体の使い方', '振付・表現力', 'テクニック向上']);
    checkbox('おすすめしたい生徒', ['初めての方', '運動が苦手な方', '基礎を深めたい方', '経験者']);
    requiredPara('初心者への指導方針').setHelpText('例：ゆっくり音を確認する、動きを分けて練習するなど。');
    requiredPara('レッスンで大切にしていること').setHelpText('例：音楽を楽しむこと、無理なく続けることなど。');
    form.addSectionHeaderItem().setTitle('3｜プロフィール').setHelpText('生徒がレッスンを選ぶ際に参考になる内容を入力してください。');
    requiredPara('これまでのダンス経験').setHelpText('開始時期・ジャンル・主な活動など。第三者の連絡先や非公開情報は記載しないでください。');
    requiredPara('生徒へのメッセージ').setHelpText('初めて受講する方に、どのように楽しんでほしいかを伝えてください。');
    optionalText('紹介動画のURL（任意）').setHelpText('公開・掲載の許可がある動画のURLのみ。動画がない場合は空欄で構いません。');
    form.addParagraphTextItem().setTitle('その他の実績・掲載希望事項（任意）').setRequired(false);
    form.addSectionHeaderItem().setTitle('4｜公開同意').setHelpText('写真は別途提出します。送信だけでは公式HPに公開されません。');
    form.addMultipleChoiceItem()
      .setTitle('公開同意（必須）')
      .setChoiceValues(['記載内容を管理者が確認し、承認した公開用情報のみ公式HPへ掲載することに同意します'])
      .setRequired(true);

    const sheet = SpreadsheetApp.create('Rhythm Speaker｜講師登録回答（非公開）');
    props.setProperty('RS_INSTRUCTOR_SHEET_ID', sheet.getId());
    form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
    props.setProperty('RS_INSTRUCTOR_SETUP_STATE', 'READY_FOR_PRIVATE_QA');
    Logger.log('回答者用URL（公式HP設定用）: ' + form.getPublishedUrl());
    Logger.log('管理者編集URL（非公開）: ' + form.getEditUrl());
    Logger.log('回答スプレッドシートURL（非公開）: ' + sheet.getUrl());
  } finally {
    lock.releaseLock();
  }
}
