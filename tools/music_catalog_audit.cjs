'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('music/data/catalog.json'));
assert.equal(data.schema_version,1);
assert(Array.isArray(data.albums)&&data.albums.length>=3);
const ids=new Set(),slugs=new Set();let total=0,direct=0;
for(const a of data.albums){
 assert(/^[a-z0-9-]+$/.test(a.slug)&&!slugs.has(a.slug),'invalid album slug');slugs.add(a.slug);
 assert(a.id&&a.title&&a.description&&Array.isArray(a.tags)&&a.tags.length);
 assert(Array.isArray(a.tracks)&&a.tracks.length);
 assert(/^https:\/\/www\.youtube\.com\/playlist\?list=[\w-]+$/.test(a.playlist_url));
 if(!a.image.startsWith('https://'))assert(fs.existsSync(path.join(root,'music',a.image)),'missing album image: '+a.image);
 const html=read('music/albums/'+a.slug+'/index.html');
 assert(html.includes('../../explorer.js')&&html.includes('../../explorer.css'),'album missing explorer: '+a.slug);
 for(const [n,t] of a.tracks.entries()){
  assert.equal(t.number,n+1);
  assert(t.id&&t.title&&t.playback&&!ids.has(t.id),'invalid track: '+t.id);ids.add(t.id);
  if(t.youtube_id){
   assert(/^[\w-]{11}$/.test(t.youtube_id),'invalid video ID: '+t.id);
   assert.equal(t.youtube_url,'https://youtu.be/'+t.youtube_id);
   assert.equal(t.playback,'video');direct++;
  }else{
   assert.equal(t.playback,'playlist');assert.equal(t.youtube_url,null);
  }
  total++;
 }
}
assert.equal(total,38,'38-track baseline changed; update audit with verified new release');
assert.equal(direct,19,'direct-video count changed; validate first');
const home=read('music/index.html'),script=read('music/explorer.js');
assert(home.includes('data-rsm-explorer')&&home.includes('./explorer.js')&&home.includes('../broadcast/'));
assert(script.includes('youtube-nocookie.com/embed/')&&script.includes('data/catalog.json'));
console.log('MUSIC AUDIT PASS: '+data.albums.length+' albums / '+total+' tracks / '+direct+' direct / '+(total-direct)+' playlist-only');
