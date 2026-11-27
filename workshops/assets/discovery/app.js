import {todayJst,formatDate,discover,shiftMonth} from './domain.js';
import {esc,card,calendar,emptyResults} from './components.js?v=20261127-1';
const $=s=>document.querySelector(s);
const datasets={public:[]};
const thisMonth=()=>todayJst().slice(0,7);
const saved=history.state?.workshopDiscovery;
const state={source:'public',past:false,query:'',date:'',month:thisMonth(),view:'calendar',...saved};

const options=()=>({...state,today:todayJst()});
const allMatching=()=>discover(datasets[state.source],{...options(),date:'',view:'list'});
const periodEvents=past=>discover(datasets.public,{...options(),past,query:'',date:'',view:'list'});
function nearestMonth(){state.month=allMatching()[0]?.date.slice(0,7)??thisMonth();state.date=''}
function showPeriod(past,{reset=false,view=state.view}={}){
 if(reset){state.query='';$('#search').value=''}
 state.past=past;state.view=view;nearestMonth();render();
}
function focusResults(){
 const title=$('#resultTitle');
 title.focus();title.scrollIntoView({block:'start'});
}
function updateCandidates(){const names=[...new Set(datasets[state.source].map(e=>e.instructor))];$('#instructors').innerHTML=names.map(n=>`<option value="${esc(n)}"></option>`).join('')}
function render(){
 const [y,m]=state.month.split('-').map(Number);$('#monthTitle').textContent=`${y}年 ${m}月`;
 $('#calendar').innerHTML=calendar(state.month,allMatching(),state.date,todayJst());
 const selected=discover(datasets[state.source],options());
 $('#showResults').hidden=!state.date||!selected.length;$('#showResults').textContent=`この日の${selected.length}件を見る ↓`;
 $('#resultTitle').textContent=state.date?formatDate(state.date):state.view==='list'?(state.past?'これまでの開催記録':'すべての開催予定'):`${m}月の${state.past?'開催記録':'ワークショップ'}`;
 $('#count').textContent=`${selected.length}件${state.view==='list'&&!state.date?' · 月をまたいですべて表示':''}${state.date?' · 日付で絞り込み中':''}`;
 $('#chips').innerHTML=`${state.date?`<button data-clear="date">${formatDate(state.date)} ×</button>`:''}${state.query?`<button data-clear="query">講師：${esc(state.query)} ×</button>`:''}`;
 $('#clearTeacher').disabled=!state.query;$('#clearDate').disabled=!state.date;
 $('#cards').innerHTML=selected.length
  ?selected.map(e=>card(e,state.past)).join('')
  :emptyResults(state,periodEvents(state.past).length>0,periodEvents(true).length>0);
 $('.workspace').classList.toggle('list-mode',state.view==='list');
 for(const [id,value]of[['upcoming',!state.past],['past',state.past],['calView',state.view==='calendar'],['listView',state.view==='list']]){$('#'+id).setAttribute('aria-pressed',String(value))}
}
function clear(type){if(type==='date')state.date='';else if(type==='query'){state.query='';$('#search').value=''}else{state.date='';state.query='';$('#search').value=''}render()}
$('#search').addEventListener('input',e=>{state.query=e.target.value;render()});
$('#clearTeacher').onclick=()=>{clear('query');$('#search').focus()};$('#clearDate').onclick=()=>{clear('date');$('#monthTitle').focus()};$('#reset').onclick=()=>{clear();$('#search').focus()};
$('#showResults').onclick=focusResults;
$('#chips').onclick=e=>{const b=e.target.closest('[data-clear]');if(b){const type=b.dataset.clear;clear(type);(type==='query'?$('#search'):$('#monthTitle')).focus()}};
$('#calendar').onclick=e=>{const b=e.target.closest('[data-date]');if(b){const d=b.dataset.date;state.date=state.date===d?'':d;render();document.querySelector(`[data-date="${d}"]`)?.focus()}};
$('#calendar').onkeydown=e=>{const b=e.target.closest('[data-date]');if(!b)return;const buttons=[...$('#calendar').querySelectorAll('button')],i=buttons.indexOf(b),map={ArrowLeft:i-1,ArrowRight:i+1,ArrowUp:i-7,ArrowDown:i+7,Home:0,End:buttons.length-1};if(e.key in map){e.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,map[e.key]))].focus()}};
for(const [id,n]of[['prev',-1],['next',1]])$('#'+id).onclick=()=>{state.month=shiftMonth(state.month,n);state.date='';render()};
$('#nearest').onclick=()=>{nearestMonth();render()};
for(const [id,past]of[['upcoming',false],['past',true]])$('#'+id).onclick=()=>showPeriod(past);
$('#findUpcoming').addEventListener('click',event=>{
 if(!$('#upcoming').disabled){
  event.preventDefault();
  showPeriod(false,{reset:true,view:'calendar'});
  $('#explore').focus();
  $('#explore').scrollIntoView({block:'start'});
 }
});
for(const [id,view]of[['calView','calendar'],['listView','list']])$('#'+id).onclick=()=>{state.view=view;render()};
$('#cards').onclick=e=>{
 if(e.target.closest('a[href^="./event.html"]')){
  history.replaceState({...history.state,workshopDiscovery:state},'');
  return;
 }
 const action=e.target.closest('[data-empty]')?.dataset.empty;
 if(!action)return;
 if(action==='archive')showPeriod(true,{reset:true,view:'list'});
 else if(action==='list')showPeriod(state.past,{reset:true,view:'list'});
 else clear();
 focusResults();
};
// Native modal handles focus containment; image failures preserve all text content.
$('#cards').addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.parentElement.innerHTML='<div class="flyer-fallback"><span class="fallback-mark">RS</span><strong>フライヤーを表示できません</strong><small>詳細はテキストをご確認ください。</small></div>'},true);
try {
 const store=await RSStore.get();
 if(store.mode!=='live')throw new Error('Live store required');
 const rows=await store.listEvents({publishedOnly:true});
 datasets.public=rows.filter(e=>e.status==='published'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e=>({...e,source:'public',flyerProvided:false,instructor:e.instructor||'講師未登録',flyer:RSWorkshopFlyer(e),sessions:(e.sessions||[]).filter(s=>s.active!==false).map(s=>({...s,start:s.start?String(s.start).slice(0,5):'時間未登録',end:s.end?String(s.end).slice(0,5):'時間未登録'}))}));
 updateCandidates();
 $('#search').value=state.query;
 if(!saved)nearestMonth();
 render();$('#loadStatus').textContent='予約状況は各イベントの詳細ページでご確認ください。';
} catch(error) {
 $('#loadStatus').setAttribute('role','alert');$('#loadStatus').textContent='開催情報を取得できませんでした。再読み込みしてください。';
 $('#cards').textContent='カレンダー・開催情報を読み込めませんでした。';
 document.querySelectorAll('#explore button,#search').forEach(el=>el.disabled=true);
}
