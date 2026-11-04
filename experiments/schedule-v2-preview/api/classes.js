'use strict';
const SOURCE='https://noritap.github.io/rhythmspeaker/data/class-sessions.public.json';
const TZ='Asia/Tokyo';
const safeString=(s,n=90)=>typeof s==='string'?s.slice(0,n):'';
const dateTokyo=(d)=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function fixtures(){
 const classes=[['STEP','STEP','デモ講師A'],['TAP','TAP','デモ講師B'],['ISOLATION','ISOLATION','デモ講師A'],['STRETCH','STRETCH','デモ講師C'],['STEP & 振付','STEP & 振付','デモ講師B'],['TAP初級','TAP初級','デモ講師C']];
 const data=[];
 for(let i=0;i<14;i++){
  const d=new Date(Date.now()+(i+1)*864e5),date=dateTokyo(d);
  const [className,classType,instructorName]=classes[i%classes.length];
  data.push({id:'demo-'+i,date,start:i%3===0?'07:00':i%3===1?'13:00':'18:30',end:i%3===0?'08:00':i%3===1?'14:00':'19:30',className,classType,instructorName,publicStatus:i===7?'CLOSE':i===10?'CANCELLED':'OPEN',source:'demo'});
 }
 return data;
}
function publicProjection(s){
 if(!s||typeof s!=='object')return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s.date||'')||!/^\d\d:\d\d$/.test(s.start||'')||!/^\d\d:\d\d$/.test(s.end||''))return null;
 if(!['OPEN','CLOSE','CANCELLED','INQUIRY_ONLY'].includes(s.publicStatus))return null;
 return {id:safeString(s.id,90),date:s.date,start:s.start,end:s.end,className:safeString(s.className,90),classType:safeString(s.classType,60),instructorName:/^(OPEN|CLOSE|CANCELLED)$/i.test(s.instructorName||'')?'スタジオに確認':safeString(s.instructorName,70),publicStatus:s.publicStatus,source:'public_snapshot'};
}
module.exports=async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Access-Control-Allow-Origin','same-origin');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'method_not_allowed'}));}
 try{
  const mode=req.query?.mode==='demo'?'demo':'public';
  if(mode==='demo')return res.end(JSON.stringify({version:'2.0-preview',mode:'demo',lastSuccessfulSyncAt:new Date().toISOString(),dataState:'demo',canRequest:false,sessions:fixtures()}));
  const response=await fetch(SOURCE,{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('http_'+response.status);
  const data=await response.json();
  if(data?.sourceMode!=='live'||!Array.isArray(data?.sessions))throw new Error('invalid_public_envelope');
  const time=Date.parse(data.lastSuccessfulSyncAt||'');
  const age=Number.isFinite(time)?Date.now()-time:Infinity;
  const rows=data.sessions.map(publicProjection).filter(Boolean).filter(s=>Date.parse(s.date+'T'+s.end+':00+09:00')>Date.now()).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  res.end(JSON.stringify({version:'2.0-preview',mode:'public',dataState:age>3*3600e3?'stale':'ready',lastSuccessfulSyncAt:data.lastSuccessfulSyncAt,source:'GitHub Pages公開用JSON（直接Google連携ではありません）',canRequest:false,sessions:rows}));
 }catch(e){res.statusCode=503;res.end(JSON.stringify({version:'2.0-preview',dataState:'unavailable',canRequest:false,error:'public_source_unavailable',sessions:[]}));}
};