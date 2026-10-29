/* Supplied flyer fallback only; live event/session data remains in RSStore. */
(() => {
 const root=new URL('./discovery/flyers/',document.currentScript.src);
 const files={
  'nene-beginner-tap-2026-11-03':'nene-beginner-tap-2026-11-03.webp',
  'sakaida-koji-20261122':'sakaida-koji-20261122.webp',
  'naoyuki-2026-10-16':'naoyuki-2026-10-16.webp'
 };
 window.RSWorkshopFlyer=e=>e.flyerUrl||e.cover||(files[e.slug]?new URL(files[e.slug],root).href:'');
})();
