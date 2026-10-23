/* Workshop editor local preview: no network, no draft data persistence. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const field = id => document.getElementById(id)?.value?.trim() || '';
  function renderPreview() {
    const form = document.getElementById('eventForm');
    if (!form || form.classList.contains('hidden')) return;
    const title = field('eTitle') || 'タイトル未入力';
    const instructor = field('eInstructor') || '講師未入力';
    const date = field('eDate') || '開催日未入力';
    const sessions = [...form.querySelectorAll('.session-card')].map((el, i) => {
      const v = key => el.querySelector('[data-k="'+key+'"]')?.value || '';
      return {name:v('name') || 'クラス '+(i+1),start:v('start'),end:v('end'),price:v('price'),capacity:v('capacity'),level:v('level')};
    });
    const classes = sessions.map(s => '<section class="session"><h3>'+esc(s.name)+'</h3><p>'+esc(s.start)+'〜'+esc(s.end)+'　'+esc(s.price)+'円　定員'+esc(s.capacity)+'名</p><p>'+esc(s.level)+'</p></section>').join('');
    const html = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>掲載確認｜'+esc(title)+'</title><style>body{font:16px/1.75 system-ui,sans-serif;background:#f6f5f0;color:#242424;margin:0}main{max-width:660px;margin:auto;padding:20px}.notice{padding:14px;border:2px solid #9d731f;background:#fff3d5;border-radius:12px}.card{background:white;padding:22px;border-radius:16px;margin-top:20px}h1{line-height:1.35}.session{border-top:1px solid #ddd;padding:12px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}.muted{color:#555}</style></head><body><main><div class="notice"><strong>掲載確認用・予約不可</strong><div>この画面は管理者の端末内で作成したプレビューです。一般公開・保存・予約は行われません。</div></div><article class="card"><p class="muted">RHYTHM SPEAKER WORKSHOPS</p><h1>'+esc(title)+'</h1><p>講師：'+esc(instructor)+'</p><p>開催日：'+esc(date)+'</p><p>会場：'+esc(field('eVenue'))+'</p><p>'+esc(field('eSummary'))+'</p><p>'+esc(field('eDescription'))+'</p><h2>クラス詳細</h2>'+classes+'<p class="muted">予約受付はできません</p></article></main></body></html>';
    const blob = new Blob([html],{type:'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='workshop-review-preview.html';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  const observer = new MutationObserver(() => {
    const form = document.getElementById('eventForm');
    if (!form || form.querySelector('#localWsPreviewBtn')) return;
    const btn = document.createElement('button');
    btn.id='localWsPreviewBtn';btn.type='button';btn.className='btn subtle';
    btn.textContent='掲載イメージを確認（HTML保存）';
    btn.addEventListener('click',renderPreview);
    const save = form.querySelector('button[type="submit"]');
    if (save) save.before(btn); else form.append(btn);
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
