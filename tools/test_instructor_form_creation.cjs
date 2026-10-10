// Offline behavior checks. These do not verify Google account permissions or storage.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../docs/instructor-registration/google-forms/create-form.gs'), 'utf8');

function harness({ failAt, locked = false, properties = {} } = {}) {
  const state = { properties: { ...properties }, forms: 0, sheets: 0, released: false, items: [], settings: {} };
  const form = new Proxy({}, { get(_, method) {
    if (method === 'getId') return () => 'test-form';
    if (method.startsWith('get')) return () => 'test-only';
    if (method.startsWith('add')) return () => {
      if (failAt === 'questions') throw Error('injected question failure');
      const item = { type: method };
      state.items.push(item);
      const proxy = new Proxy({}, { get(_, name) { return value => { item[name] = value; return proxy; }; } });
      return proxy;
    };
    return (...args) => {
      if (method === 'setDestination' && failAt === 'destination') throw Error('injected destination failure');
      state.settings[method] = args;
      return form;
    };
  } });
  const validation = { requireTextIsEmail() { return this; }, build() { return 'email-validation'; } };
  const context = vm.createContext({
    LockService: { getScriptLock: () => ({ tryLock: () => !locked, releaseLock: () => { state.released = true; } }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => state.properties[key],
      setProperty: (key, value) => { state.properties[key] = value; },
    }) },
    FormApp: { create: () => { state.forms++; return form; }, createTextValidation: () => validation, DestinationType: { SPREADSHEET: 'sheet' } },
    SpreadsheetApp: { create: () => {
      if (failAt === 'sheet') throw Error('injected sheet failure');
      state.sheets++;
      return { getId: () => 'test-sheet', getUrl: () => 'test-only' };
    } },
    Logger: { log() {} },
  });
  vm.runInContext(source, context);
  return { state, run: () => context.createInstructorForm() };
}

test('successful setup remains closed and suppresses public response summaries', () => {
  const h = harness(); h.run();
  assert.equal(h.state.forms, 1); assert.equal(h.state.sheets, 1);
  assert.equal(h.state.settings.setAcceptingResponses[0], false);
  assert.equal(h.state.settings.setPublishingSummary[0], false);
  assert.equal(h.state.settings.setCollectEmail[0], false);
  assert.equal(h.state.settings.setLimitOneResponsePerUser[0], false);
  assert.equal(h.state.settings.setDestination[1], 'test-sheet');
  assert.equal(h.state.properties.RS_INSTRUCTOR_SETUP_STATE, 'READY_FOR_PRIVATE_QA');
  assert.equal(h.state.released, true);
  assert.throws(h.run, /Existing or incomplete/);
  assert.equal(h.state.forms, 1);
});

test('13 original questions remain, with optional media and required consent', () => {
  const h = harness(); h.run();
  const questions = h.state.items.filter(x => x.type !== 'addSectionHeaderItem');
  assert.equal(questions.length, 13);
  assert.equal(h.state.items.filter(x => x.type === 'addSectionHeaderItem').length, 4);
  const email = questions.find(x => x.setTitle.includes('非公開'));
  assert.equal(email.setValidation, 'email-validation');
  assert.equal(questions.find(x => x.setTitle.includes('紹介動画')).setRequired, false);
  assert.equal(questions.find(x => x.setTitle.includes('公開同意')).setRequired, true);
  assert.equal(questions.some(x => x.type === 'addFileUploadItem'), false);
});

for (const failAt of ['questions', 'sheet', 'destination']) {
  test(`partial failure at ${failAt} preserves IDs and blocks duplicate retry`, () => {
    const h = harness({ failAt });
    assert.throws(h.run, /injected/);
    assert.equal(h.state.properties.RS_INSTRUCTOR_FORM_ID, 'test-form');
    assert.equal(h.state.properties.RS_INSTRUCTOR_SETUP_STATE, 'CREATING');
    if (failAt === 'destination') assert.equal(h.state.properties.RS_INSTRUCTOR_SHEET_ID, 'test-sheet');
    assert.equal(h.state.released, true);
    assert.throws(h.run, /Existing or incomplete/);
    assert.equal(h.state.forms, 1);
  });
}

test('concurrent creation cannot acquire lock or create files', () => {
  const h = harness({ locked: true });
  assert.throws(h.run, /Creation already running/);
  assert.equal(h.state.forms, 0); assert.equal(h.state.sheets, 0);
});

test('orphaned sheet or incomplete creation marker blocks new form', () => {
  for (const properties of [{ RS_INSTRUCTOR_SHEET_ID: 'existing' }, { RS_INSTRUCTOR_SETUP_STATE: 'CREATING' }]) {
    const h = harness({ properties });
    assert.throws(h.run, /Existing or incomplete/);
    assert.equal(h.state.forms, 0); assert.equal(h.state.released, true);
  }
});
