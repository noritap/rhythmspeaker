const suppliedFlyers = {'nene-beginner-tap-2026-11-03':'assets/nene-beginner-tap-2026-11-03.webp'};
// Pure discovery rules; independent of rendering and the live reservation store.
export const normalizeText = v => String(v || '').normalize('NFKC').replace(/[\s　]/g, '').toLocaleLowerCase('ja').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
export const todayJst = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const formatDate = date => new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date(`${date}T12:00:00+09:00`));
export const yen = n => Number.isFinite(n) ? `¥${n.toLocaleString('ja-JP')}` : '料金未登録';
export const time = t => t ? t.slice(0,5) : '時間未登録';
export function normalizeEvent(e, source='public') {
 return {...e,source,flyerProvided:source==='public'&&!!suppliedFlyers[e.slug],instructor:e.instructor||'講師未登録',flyer:source==='public'?(suppliedFlyers[e.slug]||(e.flyer_url||e.cover?`assets/${e.slug}.webp`:'')):'',sessions:(e.workshop_sessions||[]).filter(s=>s.active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(s=>({...s,start:time(s.start_time),end:time(s.end_time)}))};
}
const instructorAliases = {'nene-beginner-tap-2026-11-03':['寧々','ねね','冴音'],'sakaida-koji-20261122':['坂井田コージ','サカイダコージ']};
export const instructorSearchText = e => normalizeText([e.instructor,...(instructorAliases[e.slug]||[])].join(' '));
export function discover(events,{past,query,date,month,view,today}) {
 return events.filter(e=>(past?e.date<today:e.date>=today)&&instructorSearchText(e).includes(normalizeText(query))&&(!date||e.date===date)&&(date||view==='list'||e.date.startsWith(month))).sort((a,b)=>(past?-1:1)*a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'ja'));
}
export const shiftMonth = (month, delta) => {const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7)};
export const isClosed = (event,today= todayJst()) => event.date<today||!event.sessions.length||!!event.registration_close_at&&new Date(event.registration_close_at)<=new Date();
export function safeUrl(value) {try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
