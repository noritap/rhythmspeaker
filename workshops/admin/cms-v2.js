(() => {
  const ADMIN_EMAIL='rhythmspeaker296@gmail.com';
  const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const lines=a=>(Array.isArray(a)?a:[]).join('\n');
  const faqText=a=>(Array.isArray(a)?a:[]).map(x=>`${x.q||''}｜${x.a||''}`).join('\n');
  const parseLines=s=>String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const parseFaq=s=>parseLines(s).map(line=>{const i=line.indexOf('｜');return i<0?{q:line,a:''}:{q:line.slice(0,i).trim(),a:line.slice(i+1).trim()};}).filter(x=>x.q);

  const baseRenderEditor=window.renderEditor;
  const baseSaveEditor=window.saveEditor;
  if(typeof baseRenderEditor==='function'){
    window.renderEditor=function(){
      baseRenderEditor();
      const firstDivider=eventForm.querySelector('.divider');
      const cms=document.createElement('section');
      cms.innerHTML=`
        <div class="row"><div><p class="eyebrow">PAGE CONTENT</p><h2 style="margin:0">公開ページの内容</h2></div></div>
        <div class="grid2" style="margin-top:14px">
          <label>サブタイトル<input id="eSubtitle" value="${esc2(editing.subtitle||'')}" placeholder="例：一緒にタップダンス、踊りましょう！"></label>
          <label>対象者<input id="eTargetAudience" value="${esc2(editing.targetAudience||'')}" placeholder="例：初心者から経験者まで"></label>
        </div>
        <label>このワークショップで体験できること<textarea id="eHighlights" rows="4">${esc2(editing.highlights||'')}</textarea></label>
        <label>講師プロフィール<textarea id="eInstructorProfile" rows="4">${esc2(editing.instructorProfile||'')}</textarea></label>
        <label>持ち物 <span class="help">1行に1項目</span><textarea id="eBringItems" rows="5">${esc2(lines(editing.bringItems))}</textarea></label>
        <label>FAQ <span class="help">1行に「質問｜回答」</span><textarea id="eFaq" rows="6">${esc2(faqText(editing.faq))}</textarea></label>
        <label>キャンセルポリシー<textarea id="eCancellationPolicy" rows="3">${esc2(editing.cancellationPolicy||'')}</textarea></label>
        <label>問い合わせ・補足<textarea id="eContactNote" rows="3">${esc2(editing.contactNote||'')}</textarea></label>
        <label>受付終了日時<input id="eRegistrationCloseAt" type="datetime-local" value="${esc2((editing.registrationCloseAt||'').slice(0,16))}"></label>
        <div class="divider"></div>`;
      firstDivider.parentNode.insertBefore(cms,firstDivider);
      eventForm.onsubmit=saveEditorCms;
    };
  }

  async function saveEditorCms(e){
    e.preventDefault();
    editing.subtitle=eSubtitle.value.trim();
    editing.targetAudience=eTargetAudience.value.trim();
    editing.highlights=eHighlights.value.trim();
    editing.instructorProfile=eInstructorProfile.value.trim();
    editing.bringItems=parseLines(eBringItems.value);
    editing.faq=parseFaq(eFaq.value);
    editing.cancellationPolicy=eCancellationPolicy.value.trim();
    editing.contactNote=eContactNote.value.trim();
    editing.registrationCloseAt=eRegistrationCloseAt.value?new Date(eRegistrationCloseAt.value).toISOString():'';
    if(eCoverFile.files[0]) editing.flyerUrl='';
    return baseSaveEditor(e);
  }

  function installSignup(){
    if(!window.loginForm||document.getElementById('signupAdminBtn')) return;
    const note=document.createElement('div');
    note.style.marginTop='12px';
    note.innerHTML=`<button id="signupAdminBtn" class="btn subtle full" type="button">初回管理者登録</button><p class="help" style="margin-top:8px">初回のみ使用します。管理者メールは ${ADMIN_EMAIL} です。</p>`;
    loginForm.appendChild(note);
    signupAdminBtn.onclick=async()=>{
      try{
        if(loginEmail.value.trim().toLowerCase()!==ADMIN_EMAIL) throw new Error('管理者メールを使用してください');
        if(loginPassword.value.length<8) throw new Error('パスワードは8文字以上にしてください');
        await store.signUp(loginEmail.value.trim(),loginPassword.value);
        toast('管理者登録を受け付けました。確認メールが届いた場合は認証してください。');
      }catch(err){toast(err.message||'登録できませんでした')}
    };
  }
  setTimeout(installSignup,0);
})();
