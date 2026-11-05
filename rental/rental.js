/* Rental page interactions are intentionally independent from SPA rendering. */
(()=>{'use strict';
const toggle=document.getElementById('menu-button'),menu=document.getElementById('menu');
function closeMenu(refocus=false){if(!toggle||!menu)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','メニューを開く');const icon=toggle.querySelector('span');if(icon)icon.textContent='＋';if(refocus)toggle.focus();}
if(toggle&&menu){toggle.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;toggle.setAttribute('aria-expanded',String(opening));toggle.setAttribute('aria-label',opening?'メニューを閉じる':'メニューを開く');const icon=toggle.querySelector('span');if(icon)icon.textContent=opening?'×':'＋';if(opening){menu.scrollTop=0;menu.querySelector('a')?.focus();}else{toggle.focus();}});document.addEventListener('click',e=>{if(!menu.hidden&&(!e.target.closest('header')||e.target.closest('#menu a')))closeMenu();});}
const viewer=document.getElementById('rl-lightbox'),picture=document.getElementById('rl-lightbox-image'),caption=document.getElementById('rl-lightbox-caption'),close=document.getElementById('rl-lightbox-close');
let prevFocus=null;
document.querySelectorAll('[data-rental-photo]').forEach(button=>button.addEventListener('click',()=>{if(!viewer||!picture)return;prevFocus=document.activeElement;const source=button.querySelector('img');picture.src=button.dataset.rentalPhoto||source?.src||'';picture.alt=source?.alt||'';if(caption)caption.textContent=button.dataset.caption||'';viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';close?.focus();}));
function hideViewer(){if(!viewer)return;viewer.setAttribute('aria-hidden','true');document.body.style.overflow='';picture?.removeAttribute('src');prevFocus?.focus();}
close?.addEventListener('click',hideViewer);
viewer?.addEventListener('click',e=>{if(e.target===viewer)hideViewer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(viewer?.getAttribute('aria-hidden')==='false'){e.preventDefault();hideViewer();}else if(menu&&!menu.hidden){e.preventDefault();closeMenu(true);}}});
})();