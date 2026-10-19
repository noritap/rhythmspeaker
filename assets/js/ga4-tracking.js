/* Rhythm Speaker GA4: no personal information in events. */
(function () {
  'use strict';
  var id = 'G-3DTLRTWX00';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: true });
  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(loader);
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('a[href]');
    if (!target) return;
    var url;
    try { url = new URL(target.href, location.href); } catch (_) { return; }
    if (url.hostname !== 'lin.ee' && url.hostname !== 'line.me' && url.hostname !== 'liff.line.me') return;
    var container = target.closest('header, nav, footer, .rb-mobile-cta, .hero');
    var locationName = container ? (container.matches('header, nav') ? 'nav' : container.matches('footer') ? 'final' : container.matches('.rb-mobile-cta') ? 'floating' : 'hero') : 'body';
    window.gtag('event', 'line_cta_click', {
      page_path: window.location.pathname,
      cta_location: locationName,
      cta_label: (target.textContent || target.getAttribute('aria-label') || '').trim().slice(0, 100)
    });
  }, true);
}());
