/* RHYTHM SPEAKER MUSIC — canonical catalog explorer v3 */
(() => {
  'use strict';
  const source = document.currentScript;
  const base = new URL('./', source.src);
  const $ = (selector, root=document) => root.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const albumsPath = slug => new URL('albums/' + encodeURIComponent(slug) + '/', base).href;
  const imagePath = path => /^https:\/\//.test(path) ? path : new URL(path, base).href;
  const playableVideo = id => typeof id === 'string' && /^[\w-]{11}$/.test(id);
  const playableList = id => typeof id === 'string' && /^[\w-]{10,80}$/.test(id);
  const state = { albums:[], filter:'ALL', query:'', expanded:false };
  let player;

  function setText(node, value) { if (node) node.textContent = value; }

  function createPlayer() {
    const el = document.createElement('aside');
    el.className = 'rsm-player';
    el.hidden = true;
    el.setAttribute('aria-label','音楽プレーヤー');
    el.innerHTML = '<div class="rsm-player__bar"><div><span class="rsm-player__kicker">NOW LISTENING</span><strong class="rsm-player__title" aria-live="polite"></strong><small class="rsm-player__context"></small></div><button type="button" class="rsm-player__close" aria-label="プレーヤーを閉じる">閉じる ×</button></div><div class="rsm-player__frame"></div><a class="rsm-player__external" target="_blank" rel="noopener noreferrer">YouTubeで開く ↗</a>';
    document.body.append(el);
    $('.rsm-player__close',el).addEventListener('click', () => {
      $('.rsm-player__frame',el).replaceChildren();
      el.hidden = true;
      document.body.classList.remove('rsm-player-open');
    });
    return el;
  }

  function play(album, track=null) {
    const isTrack = !!(track && playableVideo(track.youtube_id));
    const canList = playableList(album.playlist);
    if (!isTrack && !canList) {
      window.open(album.playlist_url, '_blank', 'noopener,noreferrer');
      return;
    }
    player ||= createPlayer();
    const frame = $('.rsm-player__frame',player);
    const iframe = document.createElement('iframe');
    const src = isTrack
      ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(track.youtube_id)
      : 'https://www.youtube-nocookie.com/embed/videoseries?list=' + encodeURIComponent(album.playlist);
    iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
    iframe.title = isTrack ? track.title + ' のYouTube再生' : album.title + ' のYouTube再生リスト';
    iframe.loading = 'eager';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(iframe);
    setText($('.rsm-player__title',player), isTrack ? track.title : album.title);
    setText($('.rsm-player__context',player), isTrack ? album.title : 'アルバム再生リスト（曲別動画ID未登録）');
    const link = $('.rsm-player__external',player);
    link.href = isTrack ? track.youtube_url : album.playlist_url;
    link.textContent = isTrack ? 'この曲をYouTubeで開く ↗' : 'アルバムをYouTubeで開く ↗';
    player.hidden = false;
    document.body.classList.add('rsm-player-open');
    $('.rsm-player__close',player).focus({ preventScroll:true });
  }

  function attachPlayActions(root) {
    root.addEventListener('click', event => {
      const btn = event.target.closest('button[data-rsm-play]');
      if (!btn || !root.contains(btn)) return;
      const album = state.albums.find(a => a.slug === btn.dataset.album);
      if (!album) return;
      const track = btn.dataset.rsmPlay === 'album' ? null : album.tracks.find(t => t.id === btn.dataset.rsmPlay);
      play(album,track || null);
    });
  }

  function trackRow(album,track) {
    const solo = playableVideo(track.youtube_id);
    return '<li class="rsm-track-row"><span class="num">' + String(track.number).padStart(2,'0') +
      '</span><span class="rsm-track-meta"><strong>' + escapeHTML(track.title) +
      '</strong><small>' + escapeHTML(album.title) + (solo ? ' · SINGLE TRACK' : ' · ALBUM PLAYLIST') +
      '</small></span><button type="button" class="rsm-play-button" data-album="' +
      escapeHTML(album.slug) + '" data-rsm-play="' + escapeHTML(solo ? track.id : 'album') +
      '" aria-label="' + escapeHTML(solo ? track.title + 'を再生' : album.title + 'の再生リストを開く') +
      '">▶ ' + (solo ? '聴く' : 'アルバムを聴く') + '</button></li>';
  }

  function renderAlbum(album) {
    const list = $('ol.tracklist');
    if (!list) return;
    list.innerHTML = album.tracks.map(t=>trackRow(album,t)).join('');
    list.classList.add('rsm-tracklist');
    const parent = list.parentElement;
    if (!$('.rsm-track-notice',parent)) {
      const notice = document.createElement('p');
      notice.className = 'rsm-track-notice';
      notice.textContent = album.tracks.some(t => !playableVideo(t.youtube_id))
        ? '曲別動画が未登録の曲は、アルバム全体の再生リストを開きます。選択した曲へ直接移動するものではありません。'
        : '曲名の右にある「聴く」から、曲別のYouTubeプレーヤーを開けます。';
      list.before(notice);
    }
    attachPlayActions(parent);
  }

  function renderCards() {
    const grid = $('.release-grid');
    if (!grid) return;
    grid.innerHTML = state.albums.map((a,i) =>
      '<article class="release-unit"><a class="release-card" href="' + albumsPath(a.slug) +
      '"><div class="release-media"><img src="' + escapeHTML(imagePath(a.image)) +
      '" alt="' + escapeHTML(a.title) + ' アートワーク" loading="lazy" decoding="async" width="500" height="500">' +
      (i===0 ? '<span class="release-badge">FEATURED ALBUM</span>' : '') +
      '</div><div class="release-body"><span class="release-no">' + escapeHTML(a.id) + ' / ' + a.tracks.length +
      ' TRACKS</span><h3>' + escapeHTML(a.title) + '</h3><p class="release-summary">' + escapeHTML(a.description) +
      '</p><div class="chips">' + a.tags.slice(0,4).map(t=>'<span class="chip">'+escapeHTML(t)+'</span>').join('') +
      '</div><span class="release-link">アルバムを見る →</span></div></a><button type="button" class="rsm-album-play" data-album="' +
      escapeHTML(a.slug) + '" data-rsm-play="album">▶ アルバムを聴く</button></article>'
    ).join('');
    attachPlayActions(grid);
    const latest = state.albums[0];
    const callout = $('.latest-callout');
    if (callout && latest) {
      callout.href = albumsPath(latest.slug);
      callout.setAttribute('aria-label',latest.title + ' の詳細を見る');
      setText($('.latest-callout__kicker',callout),'FEATURED / '+latest.id);
      setText($('strong',callout),latest.title);
      setText($('.latest-callout__kicker + strong + span',callout),latest.description);
      const heroCover = $('.hero-cover');
      if (heroCover) { heroCover.src = imagePath(latest.image); heroCover.alt = latest.title + ' アートワーク'; }
      const heroLink = $('.hero--latest .actions .btn--gold');
      if (heroLink) heroLink.href = latest.playlist_url;
      const visualMark = $('.visual-mark');
      if (visualMark && visualMark.lastChild && visualMark.lastChild.nodeType === Node.TEXT_NODE)
        visualMark.lastChild.textContent = 'NEW / ' + latest.id;
    }
  }

  function renderExplorer() {
    const root = $('[data-rsm-explorer]');
    if (!root) return;
    const input = $('[data-rsm-search]',root);
    const chips = $('[data-rsm-tags]',root);
    const results = $('[data-rsm-results]',root);
    const count = $('[data-rsm-count]',root);
    const more = $('[data-rsm-more]',root);
    const tags = ['ALL',...new Set(state.albums.flatMap(a=>a.tags))];
    const renderTags = () => {
      chips.innerHTML = tags.map(tag=>'<button type="button" data-rsm-tag="'+escapeHTML(tag)+'" aria-pressed="'+(state.filter===tag)+'">'+escapeHTML(tag==='ALL'?'すべて':tag)+'</button>').join('');
    };
    const renderMatches = () => {
      const norm = v => String(v||'').normalize('NFKC').toLowerCase();
      const q = norm(state.query.trim());
      const rows = state.albums.flatMap(a=>a.tracks.map(t=>({a,t})))
        .filter(({a,t})=>(state.filter==='ALL'||a.tags.includes(state.filter)) &&
          (!q || norm([a.title,t.title,a.tags.join(' ')].join(' ')).includes(q)));
      setText(count,rows.length+'曲の検索結果');
      results.innerHTML = rows.slice(0,state.expanded?rows.length:12).map(({a,t})=>trackRow(a,t)).join('');
      more.hidden = state.expanded || rows.length<=12;
      more.textContent='残り'+Math.max(0,rows.length-12)+'曲を表示';
    };
    chips.addEventListener('click',e=>{
      const btn=e.target.closest('button[data-rsm-tag]');
      if(!btn)return;
      state.filter=btn.dataset.rsmTag;
      state.expanded=false;
      renderTags();renderMatches();
    });
    input.addEventListener('input',()=>{state.query=input.value;state.expanded=false;renderMatches()});
    more.addEventListener('click',()=>{state.expanded=true;renderMatches()});
    renderTags();renderMatches();attachPlayActions(root);
    root.hidden = false;
  }

  async function run() {
    try {
      const response = await fetch(new URL('data/catalog.json',base),{cache:'no-cache'});
      if(!response.ok) throw new Error('catalog HTTP '+response.status);
      const catalog = await response.json();
      if(!Array.isArray(catalog.albums)||!catalog.albums.every(a=>Array.isArray(a.tracks)))throw Error('invalid catalog');
      state.albums = catalog.albums.filter(a=>a.published).sort((a,b)=>b.order-a.order);
      renderCards();
      renderExplorer();
      const slug = location.pathname.match(/\/music\/albums\/([^/]+)\/?/);
      if(slug) {
        const album=state.albums.find(a=>a.slug===slug[1]);
        if(album) renderAlbum(album);
      }
    } catch(error) {
      console.error('[RSM MUSIC] Catalog unavailable; original album links remain available.',error);
      const root=$('[data-rsm-explorer]');
      if(root){ root.hidden=false; const status=$('[data-rsm-count]',root);if(status)status.textContent='楽曲情報を読み込めませんでした。アルバム一覧からお聴きください。';}
    }
  }
  run();
})();
