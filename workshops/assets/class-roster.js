/* Shared class-roster membership rules. This module does not grant access to participant data. */
window.RSClassRoster=Object.freeze({
  attendanceIds(person,sessions){
    const booked=sessions.find(s=>s.id===person.sessionId||s.name===person.sessionName);
    const raw=Array.isArray(person.consumes)&&person.consumes.length?person.consumes:(Array.isArray(booked?.consumes)&&booked.consumes.length?booked.consumes:[person.sessionId||booked?.id]);
    return [...new Set(raw.map(v=>sessions.find(s=>s.id===v||s.name===v)?.id||v).filter(Boolean))];
  },
  classes(sessions){
    const consumed=new Set(sessions.flatMap(s=>Array.isArray(s.consumes)?s.consumes:[]).map(v=>sessions.find(x=>x.id===v||x.name===v)?.id||v));
    return consumed.size?sessions.filter(s=>consumed.has(s.id)):sessions.filter(s=>!s.consumes?.length);
  },
  members(session,people,sessions){
    return people.filter(p=>this.attendanceIds(p,sessions).includes(session.id));
  }
});