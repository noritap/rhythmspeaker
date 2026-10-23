// Regression test for the public workshop hero. Run: node --test tests/workshop-description.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../workshops/event.html'), 'utf8');
const match = html.match(/function renderHero\(e\)\{[\s\S]*?\}\}\nasync function renderClasses/);
assert.ok(match, 'renderHero implementation must be found');
const implementation = match[0].replace(/\nasync function renderClasses$/, '');
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function render(summary, description) {
  const hero = { innerHTML: '' };
  const context = { hero, flyer: () => '', esc: escapeHtml, fmtDate: () => '2026年10月24日' };
  vm.createContext(context);
  vm.runInContext(implementation, context);
  context.renderHero({ title: 'Sample', subtitle: '', date: '2026-10-24', instructor: 'Teacher', venue: 'Studio', address: 'Tokyo', summary, description });
  return hero.innerHTML;
}
const paragraphs = s => [...s.matchAll(/<p class="detail-description">([\s\S]*?)<\/p>/g)].map(m => m[1]);

test('different summary and edited description both appear', () => {
  assert.deepEqual(paragraphs(render('Original summary', 'New introduction')), ['Original summary', 'New introduction']);
});
test('equal text appears once', () => {
  assert.deepEqual(paragraphs(render('Same', 'Same')), ['Same']);
});
test('summary-only and description-only events retain content', () => {
  assert.deepEqual(paragraphs(render('Summary only', '')), ['Summary only']);
  assert.deepEqual(paragraphs(render('', 'Description only')), ['Description only']);
});
test('both values are escaped, not injected as HTML', () => {
  assert.deepEqual(paragraphs(render('<script>alert(1)</script>', '<img src=x onerror=alert(1)>')), ['&lt;script&gt;alert(1)&lt;/script&gt;', '&lt;img src=x onerror=alert(1)&gt;']);
});
