'use strict';
const assert=require('node:assert/strict');
const root='https://noritap.github.io/rhythmspeaker';
const check=async(p,fn)=>{
 const url=root+p+(p.includes('?')?'&':'?')+'audit='+Date.now();
 let last;
 for(let i=0;i<6;i++){
  try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),15000);
   const res=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'Cache-Control':'no-cache'}});
   clearTimeout(timer);
   assert.equal(res.status,200,url+': HTTP '+res.status);
   const body=await res.text();
   assert(fn(body),url+': missing deployed content');
   console.log('LIVE PASS '+p+' '+res.status+' '+body.length+' chars');
   return;
  }catch(e){last=e;console.log('RETRY '+p+' attempt '+(i+1)+' '+e.message);if(i<5)await new Promise(resolve=>setTimeout(resolve,10000))}
 }
 throw last;
};
(async()=>{
 await check('/music/',b=>b.includes('data-rsm-explorer')&&b.includes('explorer.js'));
 await check('/music/data/catalog.json',b=>{const j=JSON.parse(b);return j.albums?.length===3&&j.albums.reduce((n,a)=>n+a.tracks.length,0)===38});
 await check('/music/explorer.js',b=>b.includes('youtube-nocookie.com/embed/')&&b.includes('renderExplorer'));
 for(const slug of ['tap-dance-in-suspense','saa-ittemiyouka','velvet-city-motion']){
  await check('/music/albums/'+slug+'/',b=>b.includes('../../explorer.js')&&b.includes('tracklist'));
 }
 console.log('MUSIC GITHUB PAGES LIVE SMOKE PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
