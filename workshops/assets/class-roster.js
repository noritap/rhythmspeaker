/* Shared class-roster membership rules. This module does not grant access to participant data. */
window.RSClassRoster=Object.freeze({
  activePeople(people){return people.filter(p=>p.status!=='cancelled'&&p.status!=='canceled');},
  attendanceIds(person,sessions){
    const booked=sessions.find(s=>s.id===person.sessionId||s.name===person.sessionName);
    const raw=Array.isArray(person.consumes)&&person.consumes.length?person.consumes:(Array.isArray(booked?.consumes)&&booked.consumes.length?booked.consumes:[person.sessionId||booked?.id]);
    return [...new Set(raw.map(v=>sessions.find(s=>s.id===v||s.name===v)?.id||v).filter(Boolean))];
  },
  classes(sessions){
    const consumed=new Set(sessions.flatMap(s=>Array.isArray(s.consumes)?s.consumes:[]).map(v=>sessions.find(x=>x.id===v||x.name===v)?.id||v));
    return consumed.size?sessions.filter(s=>consumed.has(s.id)):sessions.filter(s=>!s.consumes?.length);
  },
  escape(value){return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot',"'":'&#039;'}[c]));},
  renderCard({session,people,sessions,title='',showCheckin=true}){
    const esc=this.escape;
    const members=this.members(session,people,sessions);
    const unpaid=members.filter(p=>p.paymentStatus!=='paid').length;
    const unchecked=members.filter(p=>!p.checkin).length;
    return `<section class="roster-class" aria-label="${esc(session.name)}の参加予定者"><div class="roster-heading"><div><h3>${esc(session.name)}</h3>${title?`<small>${esc(title)}</small>`:''}</div><div class="roster-heading-stats"><strong>${members.length}名</strong><small>未入金 ${unpaid}名${showCheckin?`・未受付 ${unchecked}名`:''}</small></div></div><ol class="roster-list">${members.map(p=>`<li class="roster-person"><div class="roster-person-main"><strong>${esc(p.name)}</strong>${p.reservationKind==='instructor_special'?'<span class="special-badge">イントラ特別枠</span>':''}<span class="roster-booking">${esc(p.sessionName||sessions.find(s=>s.id===p.sessionId)?.name||'')}</span></div><div class="roster-person-side"><span class="${p.paymentStatus==='paid'?'pay-paid':'pay-unpaid'}">${p.paymentStatus==='paid'?'入金済':'未入金'}</span>${showCheckin?`<small>${p.checkin?'受付済':'未受付'}</small>`:''}</div></li>`).join('')||'<li class="roster-person">参加予定者はいません</li>'}</ol></section>`;
  },
  members(session,people,sessions){
    return this.activePeople(people).filter(p=>this.attendanceIds(p,sessions).includes(session.id));
  }
});