/* Rhythm Speaker: photo manifest loader (progressive enhancement).
 * Only replace fallbacks for verified images explicitly published in the manifest.
 * No speculative URLs, no broken images while assets await repository upload.
 */
(()=>{'use strict';
const images=[...document.querySelectorAll('img[data-studio-photo-id]')];
if(!images.length)return;
const root='/rhythmspeaker/';
const allowed=/^assets\/images\/studio\/library\/2026-11\/web\/img_\d{4}\.webp$/;
fetch(root+'data/studio-photo-library-public.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('manifest');return r.json()})
.then(manifest=>{
 const published=manifest.published||{};
 images.forEach(img=>{
  const id=img.getAttribute('data-studio-photo-id'),entry=published[id];
  if(typeof entry!=='string'||!allowed.test(entry))return;
  const url=root+entry;
  const probe=new Image();
  probe.onload=()=>{
   img.src=url;
   if(img.dataset.studioPhotoAlt)img.alt=img.dataset.studioPhotoAlt;
   document.querySelectorAll('a[data-studio-photo-link="'+id+'"]').forEach(a=>{a.href=url});
  };
  probe.src=url;
 });
}).catch(()=>{/* Offline/older deployments keep the original photos. */});
})();