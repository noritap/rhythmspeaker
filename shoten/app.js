(async () => {
  'use strict';
  const { products, articles, categories, brand, loadState } = await window.SHOTEN_READY;
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#compare-dialog');
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const category = id => categories.find(c => c.id === id);
  const byId = id => products.find(p => p.id === id);
  const core = window.CatalogCore;
  const displayMedia = p => p.approvedPhoto
    ? {mode:'LOCAL_PHOTO',url:p.approvedPhoto,label:'掲載許諾を確認した写真'}
    : {mode:'ILLUSTRATION'};
  const commerceStatus = p => p.purchase.kind === 'AFFILIATE' ? '広告リンク確認済み' : '購入リンク確認中';
  const canCompare = products.length >= 2;
  const headerCompare = document.querySelector('.header-compare');
  if (headerCompare && !canCompare) headerCompare.hidden = true;
  const adEnabled = products.some(p=>p.purchase.kind==='AFFILIATE');
  const disclosure = adEnabled ? '広告｜当サイトはAmazonアソシエイト・プログラムを利用しています。Amazon のアソシエイトとして、リズムスピーカー商店は適格販売により収入を得ています。' : '現在、掲載中の商品とAmazon紹介リンクはありません。';
  $('#affiliate-disclosure').textContent = disclosure;
  let compare = [];
  try { const saved = JSON.parse(localStorage.getItem('rs-shop-compare-v1') || '[]'); if (Array.isArray(saved)) compare = [...new Set(saved)].filter(id => byId(id)).slice(0,3); } catch (_) {}
  if (!canCompare) compare = [];
  const emptyFilters = () => ({q:'',category:'all',subcategory:'all',purpose:'all',verified:'all',sort:'editor'});
  let filter = emptyFilters();
  let articleFilter = {q:'', category:'all'};
  let toastTimer;
  let compareTrigger;
  const lineIcon = (id) => {
    const paths = {home:'<path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-7h6v7"/>',sound:'<path d="M5 14v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="12" width="5" height="8" rx="2"/><rect x="16" y="12" width="5" height="8" rx="2"/>',outdoor:'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 7V3h8v4m-4 3-3 5h5l-3 4"/>'};
    return `<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.home}</svg>`;
  };
  const arrow = '<span aria-hidden="true">↗</span>';
  function productArt(kind, hero=false) {
    let shape='';
    if (kind.startsWith('headphones')) {
      const light = kind.endsWith('cream');
      const c=light?'#d6d5c8':'#343b3c', d=light?'#b4b6aa':'#20292a', pad=light?'#efeee2':'#4c5453';
      shape=`<ellipse cx="180" cy="258" rx="95" ry="12" fill="#182425" opacity=".09"/><g transform="rotate(-13 180 165)"><path d="M99 172V123a81 81 0 0 1 162 0v49" fill="none" stroke="${d}" stroke-width="26"/><path d="M99 143v-20a81 81 0 0 1 162 0v20" fill="none" stroke="${c}" stroke-width="17"/><path d="M103 159v45m153-45v45" stroke="${c}" stroke-width="14"/><rect x="76" y="144" width="49" height="94" rx="22" fill="${d}"/><rect x="80" y="144" width="34" height="94" rx="17" fill="${c}"/><rect x="117" y="153" width="15" height="78" rx="7" fill="${pad}"/><rect x="235" y="144" width="49" height="94" rx="22" fill="${d}"/><rect x="248" y="144" width="32" height="94" rx="16" fill="${c}"/><rect x="229" y="153" width="15" height="78" rx="7" fill="${pad}"/><path d="M257 165v51" stroke="${pad}" opacity=".4" stroke-width="2"/></g>`;
    } else if (kind.startsWith('vacuum')) {
      const light = kind.endsWith('white'), c=light?'#e9e8df':'#303a38', face=light?'#f7f5ee':'#48514c', stroke=light?'#cecfc3':'#202d28';
      shape=`<ellipse cx="182" cy="261" rx="114" ry="12" fill="#162d26" opacity=".08"/><rect x="157" y="47" width="114" height="171" rx="20" fill="${c}"/><path d="M177 47h73a20 20 0 0 1 20 20v19H157V67a20 20 0 0 1 20-20" fill="${face}"/><path d="M172 119h84m-84 5h84" stroke="${stroke}" stroke-width="2"/><rect x="195" y="60" width="38" height="4" rx="2" fill="${stroke}"/><rect x="174" y="190" width="80" height="28" rx="6" fill="${stroke}"/><path d="m78 242-19 11m28-6 3 15m0-17 14 12" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/><ellipse cx="144" cy="227" rx="81" ry="31" fill="${stroke}"/><path d="M63 214v12c0 18 36 32 81 32s81-14 81-32v-12" fill="${c}"/><ellipse cx="144" cy="214" rx="81" ry="32" fill="${face}"/><ellipse cx="144" cy="214" rx="70" ry="26" fill="none" stroke="${stroke}" stroke-width="1" opacity=".5"/><ellipse cx="150" cy="201" rx="20" ry="8" fill="${c}"/><path d="M130 196v6c0 6 40 6 40 0v-6" fill="${c}"/><ellipse cx="150" cy="195" rx="20" ry="7" fill="${face}"/><rect x="112" y="217" width="20" height="3" rx="1" fill="${stroke}"/>`;
    } else {
      const dc=kind.endsWith('dc');
      shape=`<ellipse cx="180" cy="267" rx="86" ry="11" fill="#182624" opacity=".1"/><g transform="${dc?'translate(20 0) scale(.9 1)':'translate(0 0)'}"><path d="M127 85V59q0-11 12-11h77q12 0 12 11v26" fill="none" stroke="#343e3b" stroke-width="13"/><path d="M99 97q0-16 16-20l112-10 33 26v155l-31 15-114-8q-16-1-16-16z" fill="#343e3b"/><path d="m229 91 31 2v155l-31 15z" fill="#202e29"/><path d="m99 97 130-6v172l-114-8q-16-1-16-16z" fill="#505953"/><path d="m114 106 100-4v51l-100 2z" fill="#1b2d29"/><text x="127" y="132" fill="#c8e1bb" font-size="19" font-family="monospace">100<tspan font-size="10">%</tspan></text><path d="M126 141h50m5 0h21" stroke="#b8dca9" stroke-width="2"/><path d="M119 173h26m18 0h26m-70 15h26m18 0h26" stroke="#1e2c28" stroke-width="7" stroke-linecap="round"/>${dc?'<path d="M123 221h21m15 0h21" stroke="#1e2c28" stroke-width="9" stroke-linecap="round"/>':'<rect x="120" y="205" width="34" height="33" rx="5" fill="#26362e"/><path d="M131 215v7m11-7v7" stroke="#829285" stroke-width="3"/><rect x="170" y="205" width="34" height="33" rx="5" fill="#26362e"/><path d="M181 215v7m11-7v7" stroke="#829285" stroke-width="3"/>'}<path d="M242 118v110m5-107v105m5-101v98" stroke="#526256" stroke-width="2" opacity=".6"/></g>`;
    }
    return `<svg class="product-art${hero?' is-hero':''}" viewBox="0 0 360 300" role="img" aria-label="${esc(kind.startsWith('headphones')?'ヘッドホン':kind.startsWith('vacuum')?'ロボット掃除機':'ポータブル電源')}のイメージイラスト">${shape}</svg>`;
  }
  const avatar = `<span class="avatar" aria-hidden="true"><img src="${esc(brand.guide.avatar)}" alt="" width="64" height="64"></span>`;
  $('#parent-links').innerHTML=brand.parent_links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('');
  function articleArt(a) {
    const type = {clean:'vacuum-white',listen:'headphones-cream',power:'power-ac',editor:'headphones-black'}[a.art];
    return `<div class="article-art art-${a.art}"><span class="art-index">${{clean:'01',listen:'02',power:'03',editor:'04'}[a.art]}</span>${a.art==='editor'?`<div class="editor-symbol">${avatar}<span>HELLO,<br>GOOD CHOICES.</span></div>`:productArt(type)}<span class="art-caption">${{clean:'CLEAN YOUR SPACE.',listen:'FIND YOUR SOUND.',power:'TAKE YOUR POWER.',editor:'A NOTE FROM OUR STORE.'}[a.art]}</span></div>`;
  }
  const failedMedia=new Set();
  function productVisual(p,loading='lazy') {
    const m=displayMedia(p),photo=m.mode!=='ILLUSTRATION'&&!failedMedia.has(m.url);
    const image=photo?`<img class="product-photo" src="${esc(m.url)}" alt="${esc(p.formal_name)}" data-product-photo="true" loading="${loading}" referrerpolicy="no-referrer">`:`<div class="photo-pending"><strong>${esc(p.name)}</strong><span>商品画像準備中</span></div>`;
    return `<div class="product-media" data-product-media="${p.id}" data-mode="${photo?m.mode:'ILLUSTRATION'}" data-quality="${m.quality||''}">${image}</div>`;
  }
  function mediaLabel(p){const m=displayMedia(p);return m.mode==='ILLUSTRATION'||failedMedia.has(m.url)?'商品画像準備中':m.label;}
  function restoreMedia(el,p) {
    const card=el.closest('.product-card'),detail=el.closest('.detail-image'),feature=el.closest('.edition-pick');
    el.outerHTML=productVisual(p);
    if(card){card.querySelector('.image-caption').textContent=mediaLabel(p);}
    if(detail)detail.querySelector('[data-media-caption]').textContent='商品画像準備中';
    if(feature)feature.querySelector('.edition-source').textContent='商品画像準備中';
  }
  document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement&&e.target.matches('img[data-product-photo]')){failedMedia.add(e.target.getAttribute('src'));const el=e.target.closest('[data-product-media]'),p=byId(el?.dataset.productMedia);if(p)restoreMedia(el,p);}},true);
  const subcategoryName=p=>category(p.category).children.find(c=>c.id===p.subcategory)?.name||'';
  function productCard(p,index) {
    const selected=compare.includes(p.id);
    return `<article class="product-card"><div class="product-image ${esc(p.tint)}"><a class="product-image-link" href="#/product/${p.id}"><span class="product-number">SELECT ${String(index+1).padStart(2,'0')}</span>${productVisual(p)}<span class="image-caption">${mediaLabel(p)}</span><span class="image-arrow" aria-hidden="true">↗</span></a></div><div class="product-info"><div class="card-meta"><span>${esc(subcategoryName(p))}</span>${p.curationLabel?`<span class="curator-badge">${esc(p.curationLabel)}</span>`:'' }<span>${commerceStatus(p)}</span></div><p class="product-copy">${esc(p.eyebrow)}</p><a class="product-title" href="#/product/${p.id}"><small>${esc(p.brand)}</small><h3>${esc(p.name)}</h3></a><p class="product-summary">${esc(p.summary)}</p><div class="product-spec">${esc(p.highlight)}</div><p class="verified-date">情報確認 ${esc(p.date)}</p><div class="card-bottom"><a href="#/product/${p.id}" class="text-link">商品詳細 ${arrow}</a>${p.purchase.kind==='AFFILIATE'&&p.purchase.href?`<a class="text-link amazon-card-link" href="${esc(p.purchase.href)}" target="_blank" rel="${esc(p.purchase.rel)}" referrerpolicy="no-referrer-when-downgrade" aria-label="${esc(p.name)}をAmazonで見る（広告）">Amazonで見る ${arrow}</a>`:''}${canCompare?`<button class="compare-add ${selected?'selected':''}" data-action="toggle-compare" data-id="${p.id}" aria-pressed="${selected}" aria-label="${esc(p.name)}を${selected?'比較から外す':'比較に追加'}"><span aria-hidden="true">${selected?'✓':'＋'}</span> ${selected?'比較中':'くらべる'}</button>`:''}</div></div></article>`;
  }
  function articleCard(a) { return `<article class="article-card"><a href="#/article/${a.id}" class="article-image-link" aria-label="${esc(a.title.replace('\n',''))}">${articleArt(a)}</a><div class="article-meta"><span>${a.type}</span><span>${a.time} min read</span></div><h3><a href="#/article/${a.id}">${a.title.replace('\n','<br>')}</a></h3><p>${a.excerpt}</p><a class="text-link article-read" href="#/article/${a.id}">続きを読む ${arrow}</a></article>`; }
  function searchMarkup() {
    return `<form id="search-form" role="search"><label class="search-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><span class="sr-only">商品名・ブランド・用途で検索</span><input type="search" id="search-input" name="q" placeholder="商品名・ブランド・用途で探す" value="${esc(filter.q)}" autocomplete="off"></label><button type="submit" class="search-submit">検索</button></form>`;
  }
  function homeHeroMarkup() {
    const cover = ['home','sound','outdoor'].map(id=>products.find(p=>p.category===id&&p.approvedPhoto)).filter(Boolean);
    const featureTopics = articles.filter(a=>a.feature).slice(0,3);
    return `<section class="shop-hero" aria-labelledby="shop-hero-title">
      <div class="edition-line"><span>RHYTHM SPEAKER STORE JOURNAL</span><span>VOL. 001 <i>／</i> 暮らしの道具特集</span></div>
      <div class="shop-hero-copy">
        <p class="edition-kicker">${esc([...new Set(products.map(p=>p.category_name))].join("・"))}のセレクトショップ</p>
        <h1 id="shop-hero-title">暮らしに、いいもの<span>。</span><br>毎日に、いいリズム<span>。</span></h1>
        <p class="shop-hero-description">掲載商品を、使う場面や目的から。タプ太郎と、自分に合う道具を探そう。</p>
      </div>
      ${cover.length?`<div class="edition-spread" aria-label="誌面のおすすめ商品">${cover.map((p,i)=>`<a class="edition-pick ${esc(p.category)}" href="#/product/${p.id}">
        <span class="edition-index" aria-hidden="true">0${i+1}</span>
        ${productVisual(p,'eager')}
        <span class="edition-pick-caption"><span class="edition-category">${esc(p.category_name)}</span><strong>${esc(p.formal_name)}</strong><span class="edition-source">${mediaLabel(p)}</span></span>
        <span class="edition-arrow" aria-hidden="true">↗</span>
      </a>`).join('')}</div>`:`<div class="edition-spread edition-stories" aria-label="暮らしの道具特集">
        ${featureTopics.map((a,i)=>`<a class="edition-pick edition-story" href="#/article/${a.id}">
          <span class="edition-index" aria-hidden="true">0${i+1}</span>
          <span class="edition-story-mark">${lineIcon(category(a.category)?.icon)}</span>
          <span class="edition-pick-caption"><span class="edition-category">${esc(category(a.category)?.name || a.type)}</span>
            <strong>${esc(a.title.replace('\n',' '))}</strong><span class="edition-source">${esc(a.type)} · 約${esc(a.time)}分</span>
          </span><span class="edition-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </div>`}
      <div class="edition-tools">
        ${searchMarkup()}
        <nav class="purpose-links" aria-label="目的から商品を探す">
          ${[...new Set(products.map(p=>p.purpose))].map(id=>{const label={time:'家事を時短',focus:'音に集中',carry:'外出・備え'}[id];return label?`<a href="#/products?purpose=${id}">${label} <span aria-hidden="true">↗</span></a>`:'';}).join('')}
        </nav>
      </div>
    </section>`;
  }
  function listingMarkup(home=false) {
    const heading = home ? homeHeroMarkup() : `<div class="section-head"><div><p class="eyebrow">THE GOOD PICKS</p><h1>暮らしに合う、ひとつを。</h1></div><p>気になるものを見つけて、<br>違いをくらべてみよう。</p></div>${searchMarkup()}`;
    const selection = home ? `<div class="selection-head"><div><p class="eyebrow">EDITOR’S SELECTION</p><h2>タプ太郎の道具棚</h2></div><a class="selection-guide" href="#/about">${avatar}<span>案内役 <strong>リズムタプ太郎</strong></span><span aria-hidden="true">↗</span></a></div>` : '';
    return `<section class="catalog section${home?' home-catalog':''}" id="catalog">${heading}${selection}<div class="category-tabs" role="group" aria-label="商品カテゴリ"><button data-action="category" data-category="all" aria-pressed="${filter.category==='all'}" class="${filter.category==='all'?'active':''}">すべて <small>${products.length}</small></button>${categories.filter(c=>products.some(p=>p.category===c.id)).map(c=>`<button data-action="category" data-category="${c.id}" aria-pressed="${filter.category===c.id}" class="${filter.category===c.id?'active':''}">${lineIcon(c.icon)}${c.name}<small>${products.filter(p=>p.category===c.id).length}</small></button>`).join('')}</div><div class="filter-row"><div class="result-count" id="result-count" role="status" aria-live="polite"></div><div class="selects" ${products.length<=1?'hidden':''}><label>小分類 <select id="subcategory-filter"></select></label><label>目的 <select id="purpose-filter"><option value="all">すべての目的</option><option value="time">家事の時短</option><option value="focus">集中したい</option><option value="carry">外出・備え</option></select></label><label>照合 <select id="verified-filter"><option value="all">すべて</option><option value="verified">ASIN確認済み</option></select></label><label><span class="sr-only">並び順</span><select id="sort-filter"><option value="editor">商店のセレクト順</option><option value="name">商品名順</option></select></label></div></div><div id="active-filters"></div><div class="product-grid" id="product-grid"></div><div id="matching-articles"></div><p class="catalog-footnote">掲載内容はメーカー公表仕様をもとにした紹介です。実機レビュー・販売ランキングではありません。<br>商品ごとの確認日はカードと詳細に記載しています。掲載画像は利用条件を確認した素材です。</p></section>`;
  }
  function home() {
    main.innerHTML=`${listingMarkup(true)}<section class="journal section magazine-journal"><div class="section-head"><div><p class="eyebrow">THE STORE JOURNAL</p><h2>買う前に、ちょっと読む。</h2></div><a class="text-link" href="#/articles">読みもの一覧 ${arrow}</a></div><div class="article-grid magazine-grid">${articles.slice(0,3).map(articleCard).join('')}</div></section><section class="guide-band"><div class="guide-band-symbol">${avatar}</div><div><p class="eyebrow">CURATED BY RHYTHM TAP TARO</p><h2>「いいかも」の、その先まで。</h2><p>いいところも、気になるところも。<br>自分に合う理由を見つけるお手伝いをします。</p></div><a href="#/about" class="button outline">この商店について ${arrow}</a></section>`;
    setupListing();
  }
  function setupSubcategories() {
    const list=(filter.category==='all'?categories:categories.filter(c=>c.id===filter.category)).flatMap(c=>c.children);
    if(!list.some(c=>c.id===filter.subcategory))filter.subcategory='all';
    $('#subcategory-filter').innerHTML='<option value="all">すべての小分類</option>'+list.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('#subcategory-filter').value=filter.subcategory;
  }
  function setupListing() {
    setupSubcategories();
    $('#verified-filter').value=filter.verified;
    $('#subcategory-filter').addEventListener('change',e=>{filter.subcategory=e.target.value;drawProducts();syncFilters();});
    $('#verified-filter').addEventListener('change',e=>{filter.verified=e.target.value;drawProducts();syncFilters();});
    $('#purpose-filter').value=filter.purpose;
    $('#sort-filter').value=filter.sort;
    $('#search-form').addEventListener('submit', e => {
      e.preventDefault();
      filter.q = $('#search-input').value.trim();
      drawProducts();
      syncFilters();
      if (e.currentTarget.closest('.shop-hero')) $('#result-count').scrollIntoView({block:'start'});
    });
    $('#search-input').addEventListener('input',e=>{filter.q=e.target.value;drawProducts();syncFilters();});
    $('#purpose-filter').addEventListener('change',e=>{filter.purpose=e.target.value;drawProducts();syncFilters();});
    $('#sort-filter').addEventListener('change',e=>{filter.sort=e.target.value;drawProducts();syncFilters();});
    drawProducts();
  }
  const normalize = s => s.normalize('NFKC').toLocaleLowerCase('ja').replace(/[＋+]/g,'').replace(/[\s・ー-]/g,'');
  function filteredProducts() { return core.filterProducts(products,filter); }
  function drawProducts() {
    const items=filteredProducts();
    $('#result-count').innerHTML=`<strong>${items.length}</strong> <span>件の商品</span><span class="total-count">／ 全${products.length}件</span>`;
    $('#product-grid').innerHTML=items.length?items.map((p)=>productCard(p,products.indexOf(p))).join(''):`<div class="empty-state"><span aria-hidden="true">⌕</span>${loadState==='ERROR'?'<h3>商品データを読み込めませんでした。</h3><p>時間をおいて、ページを再読み込みしてください。</p>':products.length?'<h3>ぴったりの条件が見つかりませんでした。</h3><p>キーワードを短くするか、条件を変えてみてください。</p><button class="button dark" data-action="reset-filters">条件をリセット</button>':'<h3>商品掲載の準備中です。</h3><p>道具選びのヒントは、読みものからご覧いただけます。</p><a class="button dark" href="#/articles">読みものを見る</a>'}</div>`;
    const related=$('#matching-articles');
    if(related) {
      const terms=searchTerms(filter.q);
      const matches=terms.length?articles.filter(a=>(filter.category==='all'||a.category===filter.category)&&terms.every(t=>normalize(articleText(a)).includes(t))):[];
      related.innerHTML=terms.length?`<section class="search-reading"><h2>同じキーワードの読みもの <small>${matches.length}件</small></h2>${matches.length?matches.map(a=>`<a href="#/article/${a.id}"><span>${esc(a.type)}</span><b>${esc(a.title.replace('\n',''))}</b><span aria-hidden="true">→</span></a>`).join(''):'<p>一致する記事はありません。別のキーワードでも探せます。</p>'}<a class="text-link" href="#/articles?q=${encodeURIComponent(filter.q)}">読みものを検索する →</a></section>`:'';
    }
    const active=filter.q||filter.category!=='all'||filter.purpose!=='all'||filter.subcategory!=='all'||filter.verified!=='all'||filter.sort!=='editor';
    $('#active-filters').innerHTML=active?`<div class="active-filter-label"><span>絞り込み中${filter.q?'：'+esc(filter.q):''}</span><button data-action="reset-filters">すべて解除 ×</button></div>`:'';
  }
  function syncFilters() {
    const params=new URLSearchParams();
    for (const [key,value] of Object.entries(filter)) if(value&&value!=='all'&&value!=='editor')params.set(key,value);
    const path = $('.home-catalog') ? '#/' : '#/products';
    history.replaceState(null,'',`${path}${params.size?'?'+params.toString():''}`);
  }
  function notify(message) { clearTimeout(toastTimer); const toast=$('#toast');toast.textContent=message;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500); }
  function toggleCompare(id) {
    const p=byId(id); if(!p)return;
    if(compare.includes(id)){compare=compare.filter(i=>i!==id);notify(`${esc(p.name)}を比較から外しました`);}else if(compare.length===3){notify('比較できるのは3点までです。先に1点外してください。');return;}else{compare.push(id);notify(`${esc(p.name)}を比較に追加しました`);}
    try{localStorage.setItem('rs-shop-compare-v1',JSON.stringify(compare));}catch(_){}
    const focusInDialog = dialog.contains(document.activeElement);
    const focusInTray = $('#compare-tray').contains(document.activeElement);
    updateCompare();
    if (dialog.open) {
      renderCompare();
      if (focusInDialog) dialog.querySelector('.close-button').focus();
    } else if (focusInTray) {
      ($('.compare-open') || $('.header-compare')).focus();
    }
  }
  function updateCompare() {
    $('#compare-count').textContent=compare.length;
    document.querySelectorAll('[data-action="toggle-compare"]').forEach(b=>{const selected=compare.includes(b.dataset.id);const p=byId(b.dataset.id);if(!p)return;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);b.setAttribute('aria-label',`${esc(p.name)}を${selected?'比較から外す':'比較に追加'}`);b.innerHTML=`<span aria-hidden="true">${selected?'✓':'＋'}</span> ${selected?'比較中':'くらべる'}`;});
    document.body.classList.toggle('has-tray',compare.length>0);
    $('#compare-tray').innerHTML=compare.length?`<div class="compare-tray-inner"><div class="tray-label"><b>くらべるリスト <span>${compare.length}/3</span></b><small>2〜3点で違いをチェック</small></div><div class="tray-items">${compare.map(id=>`<button data-action="toggle-compare" data-id="${id}" aria-label="${esc(byId(id).name)}を比較から外す">${esc(byId(id).name)} <span>×</span></button>`).join('')}</div><button class="button dark compare-open" data-action="compare">${compare.length>=2?'比較する':'リストを見る'} <span>→</span></button></div>`:'';
  }
  function renderCompare() {
    const selected=compare.map(byId), mixed=new Set(selected.map(p=>p.category)).size>1;
    const specs=[...new Set(selected.flatMap(p=>Object.keys(p.specs)))];
    const scrollHint=selected.length>2?'画面に収まらない場合は、表を横にスクロールできます →':'';
    const rows=[['カテゴリ',p=>subcategoryName(p)],['型番・ASIN',p=>p.model+' ／ '+(p.asin||'UNKNOWN（未照合）')],['こんな人に',p=>p.good],['選ぶ基準',p=>p.comparison['選ぶ基準']],...(!mixed?specs.map(key=>[key,p=>p.specs[key]||'—']):[['主な仕様',p=>p.comparison['主な仕様']]]),['購入前に確認',p=>p.caution],['販売について',p=>p.availability||'価格・在庫は販売サイトで確認'],['確認日',p=>p.date]];
    dialog.innerHTML=`<div class="dialog-head"><div><p class="eyebrow">SIDE BY SIDE</p><h2 id="compare-title">違いを、並べてみよう。</h2></div><button class="close-button" data-action="close-compare" aria-label="比較を閉じる">×</button></div><div class="dialog-content">${selected.length<2?`<div class="compare-empty"><h3>${selected.length?'もう1点、選んでみよう。':'気になる商品を、2〜3点。'}</h3><p>商品カードの「＋ くらべる」でリストに追加できます。<br>同じカテゴリから選ぶと、仕様の違いを確認しやすくなります。</p>${selected.map(p=>`<div class="single-compare-item"><b>${esc(p.name)}</b><button data-action="toggle-compare" data-id="${p.id}">リストから外す ×</button></div>`).join('')}<button class="button dark" data-action="close-compare">商品を見に戻る →</button></div>`:`<p class="comparison-note">${mixed?'カテゴリが異なるため、用途と選ぶ基準を中心に表示しています。':'同じカテゴリのメーカー公表仕様を並べています。'} 実機での同条件比較ではありません。</p>${scrollHint?`<div class="scroll-hint">${scrollHint}</div>`:''}<div class="compare-table-wrap" tabindex="0" aria-label="商品比較表"><table class="compare-table" data-count="${selected.length}"><thead><tr><th scope="col">CHECK POINT</th>${selected.map(p=>`<th scope="col"><div class="compare-art ${p.tint}">${productVisual(p)}</div><small>${esc(p.brand)}</small><a href="#/product/${p.id}">${esc(p.name)} ↗</a><button data-action="toggle-compare" data-id="${p.id}">外す ×</button></th>`).join('')}</tr></thead><tbody>${rows.map(([name,get])=>`<tr><th scope="row">${name}</th>${selected.map(p=>`<td>${esc(get(p))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">確認元</th>${selected.map(p=>`<td><a class="text-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">商品情報の出典 ${arrow}</a></td>`).join('')}</tr></tbody></table></div>`}</div>`;
  }
  function openCompare(trigger) {
    compareTrigger = trigger;
    renderCompare();
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('modal-open');
    if (compareTrigger) {
      const target = compareTrigger.isConnected ? compareTrigger : $('.compare-open') || $('.header-compare');
      target.focus({preventScroll:true});
      compareTrigger = null;
    }
  });
  dialog.addEventListener('click',e=>{
    const link = e.target.closest('a[href^="#/product/"]');
    if (link && link.getAttribute('href') === location.hash) {
      e.preventDefault();
      dialog.close();
    }
    if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
  });
  main.addEventListener('click', e => {
    const button=e.target.closest('[data-gallery-src]');
    if (!button) return;
    const wrap=button.closest('.detail-image');
    const hero=wrap?.querySelector('.product-photo');
    if (!hero) return;
    hero.src=button.dataset.gallerySrc;
    hero.alt=button.dataset.galleryAlt;
    wrap.querySelectorAll('[data-gallery-src]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  });
    function productPage(p) {
    const siblings=p.relatedIds.map(byId).filter(Boolean), purchase=p.purchase;
    const relatedReading=articles.filter(a=>a.products.includes(p.id));
    const gallery=Array.isArray(p.gallery)?p.gallery:[];
    const galleryMarkup=gallery.length>1?`<div class="shoten-gallery" aria-label="商品写真を切り替える">${gallery.map((photo,i)=>`<button type="button" class="shoten-gallery-thumb" data-gallery-src="${esc(photo.src)}" data-gallery-alt="${esc(photo.alt)}" aria-label="商品画像${i+1}を表示" aria-pressed="${i===0}"><img src="${esc(photo.src)}" alt="" loading="lazy"></button>`).join('')}</div>`:'';
        const readingMarkup=relatedReading.length?`<section class="section product-reading">
      <p class="eyebrow">THE STORE JOURNAL</p><h2>買う前に、ちょっと読む。</h2>
      ${relatedReading.map(a=>`<a href="#/article/${a.id}"><span><small>${esc(a.type)} · 約${esc(a.time)}分</small><strong>${esc(a.title.replace('\n',''))}</strong></span><span aria-hidden="true">↗</span></a>`).join('')}
    </section>`:'';

    main.innerHTML=`<div class="detail-wrap"><div class="breadcrumbs"><a href="#/">ホーム</a><span>/</span><a href="#/products?category=${p.category}">${esc(category(p.category).name)}</a><span>/</span><span>${esc(p.name)}</span></div><section class="product-detail"><div class="detail-image ${esc(p.tint)}">${productVisual(p)}${galleryMarkup}<span data-media-caption>${mediaLabel(p)}</span></div><div class="detail-info"><p class="eyebrow red">${esc(subcategoryName(p))}</p><p class="detail-tagline">${esc(p.eyebrow)}</p><p class="detail-brand">${esc(p.brand)}</p><h1>${esc(p.name)}</h1><p class="detail-kind">${esc(p.kind)}</p><p class="detail-summary">${esc(p.summary)}</p><div class="tags">${[p.curationLabel,...p.tags].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('')}</div><p class="verified-date">情報確認 ${esc(p.date)} · ${p.canonicalId?esc(p.canonicalId)+' · ':''}${commerceStatus(p)}</p>${canCompare?`<button class="compare-add detail-compare" data-action="toggle-compare" data-id="${p.id}" aria-pressed="false">＋ くらべる</button>`:''}<div class="purchase-box"><p class="purchase-kicker">購入先 <span>${purchase.kind==='AFFILIATE'?'広告・アフィリエイト':'掲載確認中'}</span></p>${purchase.href?`<a class="button dark amazon-link" target="_blank" rel="${purchase.rel}" referrerpolicy="no-referrer-when-downgrade" href="${esc(purchase.href)}">${esc(purchase.label)} ${arrow}</a>`:`<button class="button purchase-hold" type="button" disabled>${esc(purchase.label)}</button>`}<small>${esc(purchase.note)}<br>型番・販売者・保証条件を購入前に確認してください。</small></div></div></section><div class="detail-content">${p.studioIntro?`<section class="shoten-studio-story"><p class="eyebrow">USED AT RHYTHM SPEAKER</p><h2>スタジオでも使っている、頼れるお掃除ロボット。</h2><p>${esc(p.studioIntro)}</p></section>`:''}<div class="decision-grid"><section><p class="eyebrow">GOOD FOR</p><h2>こんな使い方に。</h2><p>${esc(p.good)}</p><ul>${p.master.recommendation_reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></section><section class="caution"><p class="eyebrow">BEFORE YOU CHOOSE</p><h2>買う前に、ここを確認。</h2><p>${esc(p.caution)}</p></section></div><section class="spec-section"><h2>基本の仕様</h2><dl>${Object.entries(p.specs).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}<div><dt>ASIN</dt><dd>${p.asin||'UNKNOWN（未照合）'}</dd></div></dl><div class="source-box"><b>情報の確認元</b><small>確認日：${p.date} ／ メーカー公表仕様。実測・実機レビューではありません。</small></div></section>${p.alternatives.length?`<section class="alternative-section"><p class="eyebrow">BEFORE YOU DECIDE</p><h2>後継・代替候補も確認。</h2>${p.alternatives.map(a=>`<article><h3>${esc(a.name)}</h3><p>${esc(a.note)}</p><a class="text-link" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">メーカー公式情報 ${arrow}</a></article>`).join('')}</section>`:''}</div>${readingMarkup}${siblings.length?`<section class="section related-products"><div class="section-head"><div><p class="eyebrow">ANOTHER GOOD PICK</p><h2>同じカテゴリで、くらべる。</h2></div><button class="text-link" data-action="compare-pair" data-ids="${[p.id,...p.relatedIds].slice(0,3).join(',')}">この商品と比較する ⇄</button></div><div class="product-grid">${siblings.map(p=>productCard(p,products.indexOf(p))).join('')}</div></section>`:''}</div>`;
  }
  const searchTerms = q => q.normalize('NFKC').trim().split(/\s+/).filter(Boolean).map(normalize);
  const articleText = a => [a.title,a.excerpt,a.lead,...a.sections.map(s=>s.title+' '+s.body),...a.products.map(id=>{const p=byId(id);return p?p.brand+' '+p.name:'';})].join(' ');
  function drawArticles(sync=true) {
    const terms=searchTerms(articleFilter.q);
    const rows=articles.filter(a=>(articleFilter.category==='all'||a.category===articleFilter.category)&&terms.every(t=>normalize(articleText(a)).includes(t)));
    $('#journal-grid').innerHTML=rows.length?rows.map(articleCard).join(''):`<div class="empty-state"><h2>条件に合う記事はありませんでした。</h2><p>キーワードを短くするか、カテゴリを変えてみてください。</p><button class="button dark" data-action="reset-articles">条件をリセット</button></div>`;
    $('.article-result').textContent=`${rows.length}件の読みもの ／ 全${articles.length}件`;
    document.querySelectorAll('.article-filters button').forEach(b=>{const active=b.dataset.category===articleFilter.category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#article-reset').hidden=!articleFilter.q&&articleFilter.category==='all';
    if(sync){const params=new URLSearchParams();if(articleFilter.q)params.set('q',articleFilter.q);if(articleFilter.category!=='all')params.set('category',articleFilter.category);history.replaceState(null,'',`#/articles${params.size?'?'+params:''}`);}
  }
  function articlesPage(params) {
    articleFilter={q:params.get('q')||'',category:categories.some(c=>c.id===params.get('category'))?params.get('category'):'all'};
    main.innerHTML=`<section class="section journal-index"><div class="breadcrumbs"><a href="#/">ホーム</a><span>/</span><span>読みもの</span></div><div class="page-heading"><p class="eyebrow red">THE STORE JOURNAL</p><h1>買う前に、<br>ちょっと読む。</h1><p>迷ったときの、選び方のヒント。<br>リズムタプ太郎と、いい買いものの準備を。</p></div><form id="article-search-form" role="search"><label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">記事のタイトル・本文・商品名で検索</span><input type="search" id="article-search-input" placeholder="読みたいテーマ・商品名で探す" value="${esc(articleFilter.q)}" autocomplete="off"></label><button class="search-submit" type="submit">検索</button></form><div class="article-filters" role="group" aria-label="記事のカテゴリ"><button data-action="article-filter" data-category="all">すべて <small>${articles.length}</small></button>${categories.map(c=>`<button data-action="article-filter" data-category="${c.id}">${c.name}</button>`).join('')}</div><div class="article-result-row"><p class="article-result" role="status" aria-live="polite"></p><button id="article-reset" data-action="reset-articles" hidden>すべて解除 ×</button></div><div class="article-grid" id="journal-grid"></div><p><a class="text-link" href="https://rhythmspeaker.hatenablog.com/">タプ太郎の毎日ブログで商品レビューを読む ${arrow}</a></p></section>`;
    $('#article-search-form').addEventListener('submit',e=>{e.preventDefault();articleFilter.q=$('#article-search-input').value;drawArticles();});
    $('#article-search-input').addEventListener('input',e=>{articleFilter.q=e.target.value;drawArticles();});
    drawArticles(false);
  }
  function articlePage(a) {
    const ps=a.products.map(byId).filter(Boolean);
    main.innerHTML=`<article class="article-detail"><div class="breadcrumbs"><a href="#/">ホーム</a><span>/</span><a href="#/articles">読みもの</a><span>/</span><span>${a.type}</span></div><div class="article-header"><p class="eyebrow red">${a.type} ／ ${a.category==='all'?'STORE NOTE':category(a.category).en}</p><h1>${a.title.replace('\n','<br>')}</h1><div class="article-byline">${avatar}<span>リズムタプ太郎 <small>AI案内人 / 公式情報をもとに編集</small></span><span>${esc(a.last_checked_at)} <i>·</i> 約${a.time}分</span></div></div>${articleArt(a)}<div class="article-body"><p class="article-lead">${a.lead}</p><nav class="article-toc" aria-label="この記事の内容"><b>この記事でわかること</b>${a.sections.map((s,i)=>`<button data-action="article-section" data-section="article-section-${i}">${s.title} <span>↓</span></button>`).join('')}</nav>${a.sections.map((s,i)=>`<section id="article-section-${i}"><h2>${s.title}</h2><p>${s.body}</p></section>`).join('')}${ps.length?`<div class="source-box"><b>参考にしたメーカー公式情報</b>${ps.map(p=>`<a href="${esc(p.source)}" rel="noopener noreferrer" target="_blank">${esc(p.brand)} ${esc(p.name)} ${arrow}</a>`).join('')}<small>商品ごとの確認日は商品詳細を参照。掲載仕様・販売状況は変更される場合があります。実機レビューではありません。</small></div>`:''}<p class="article-disclosure">${disclosure}</p><a class="text-link" href="#/articles">← 読みもの一覧に戻る</a></div>${ps.length?`<section class="article-products"><div class="section-head"><div><p class="eyebrow">IN THIS JOURNAL</p><h2>登場した商品を、くらべる。</h2></div>${a.products.length>=2?`<button class="text-link" data-action="compare-pair" data-ids="${a.products.join(',')}">この${a.products.length}点を比較する ⇄</button>`:''}</div><div class="product-grid">${ps.map(p=>productCard(p,products.indexOf(p))).join('')}</div></section>`:''}</article>`;
  }
  function infoPage(type) {
    const pages={
      about:{en:'ABOUT OUR STORE',title:'暮らしに、<br>いいリズムを。',lead:'モノを増やすより、日々の選択を少しよくする。<br>そんなきっかけを届ける、小さな商店です。',blocks:[['案内人は、リズムタプ太郎',`${avatar}<p>リズムタプ太郎は、リズムスピーカー商店のAI案内人。ダンス用品に限定せず、暮らし・仕事・音楽・外あそびに役立つ商品の違いを整理します。実際の使用経験と公式仕様による紹介を混同しません。</p>`],['見つける → くらべる → 確かめる','<p>商品名や用途で探し、気になる商品を最大3点まで比較。向いている使い方と注意点を読み、最後はメーカー情報と販売先の条件を確かめて選べます。</p>'],['今の商店について','<p>暮らし・音楽・外あそびの3カテゴリを扱います。このサイト内での決済、商品販売、利用者アカウント作成はありません。購入は外部の販売サイトで行います。商品・記事の情報は自動更新ではなく、商品ごとの確認日を表示しています。</p>'],['運営','<p>リズムスピーカー商店 ／ Rhythm Speaker<br>商品案内：リズムタプ太郎（AI）</p><p><a class="text-link" href="#/policy">広告・編集方針を読む ↗</a></p>']]},
      policy:{en:'EDITORIAL & ADVERTISING POLICY',title:'紹介する理由も、<br>広告のことも。',lead:'納得して選べるように、情報の扱いを見える形にします。',blocks:[['現在の広告リンクについて',`<p>${disclosure}</p><p>紹介リンクは商品と掲載媒体の承認を確認できた場合に表示します。</p>`],['アソシエイト導入時の表示','<p>Amazonアソシエイトを利用する場合は、商品ページの購入リンクに「広告」を表示し、次の説明をリンク付近とフッターに掲載する構成です。</p><blockquote>Amazon のアソシエイトとして、リズムスピーカー商店は適格販売により収入を得ています。</blockquote><p>紹介料の有無と、商品が利用者に向いているかは分けて判断します。</p>'],['掲載商品と比較の基準','<p>商品の使い方や機能の違いを説明できることを重視します。掲載順は販売数や満足度のランキングではありません。比較はメーカー公表仕様の整理であり、同じ条件で行った性能試験ではありません。販売価格と在庫は変わるため、販売先でご確認ください。</p>'],['出典・イラスト・更新','<p>各商品・関連記事に公式情報の出典と確認日を記載しています。実際に使用した根拠がない内容は実機レビューと表記しません。商品イラストは当サイト独自の説明用イメージであり、実物の形状・色・付属品を正確に示しません。</p><p>ポリシーの確認：2026年11月1日。自動更新は行っていません。</p>']]},
      privacy:{en:'PRIVACY',title:'気持ちよく、<br>選べる場所に。',lead:'この商店で利用するデータについて。',blocks:[['端末内に保存するもの','<p>比較リストの商品IDを、お使いのブラウザ内（localStorage）に保存します。比較画面で商品をすべて外すか、ブラウザのサイトデータを消すと解除できます。他の端末には同期されません。保存が制限された環境では、その閲覧中のみ比較できます。</p>'],['検索・アクセス解析','<p>商品検索と絞り込みは端末内で実行します。当サイト独自のアクセス解析タグや広告追跡Cookieは使用していません。検索語はURLに含まれるため、ブラウザ履歴に残る場合があります。氏名などの個人情報を検索欄に入力しないでください。</p>'],['外部サイトへの移動','<p>メーカーやAmazonへのリンクは外部サイトを新しいタブで開きます。移動先では、それぞれのプライバシーポリシーが適用されます。この商店には決済フォームや利用者登録フォームはありません。</p>'],['ホスティング','<p>このサイトはGitHub Pagesで配信しています。接続記録などには、ホスティング提供元の方針が適用されます。</p>']]}
    };
    const p=pages[type];main.innerHTML=`<section class="info-page"><div class="breadcrumbs"><a href="#/">ホーム</a><span>/</span><span>${{about:'商店について',policy:'広告・編集方針',privacy:'プライバシー'}[type]}</span></div><div class="page-heading"><p class="eyebrow red">${p.en}</p><h1>${p.title}</h1><p>${p.lead}</p></div><div class="info-body">${p.blocks.map(([h,b])=>`<section><h2>${h}</h2>${b}</section>`).join('')}<a class="button dark" href="#/products">商品を見にいく ↗</a></div></section>`;
  }
  function setNav(section) {document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===section;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
  function route() {
    compareTrigger = null;
    if(dialog.open)dialog.close();
    const [path,query='']=(location.hash.slice(1)||'/').split('?');
    const parts=path.split('/').filter(Boolean);const params=new URLSearchParams(query);
    let title='暮らしに、いいリズムを。';setNav(parts[0]==='product'?'products':parts[0]==='article'?'articles':parts[0]);
    if (!parts.length || parts[0]==='products') {
      filter={q:params.get('q')||'',category:categories.some(c=>c.id===params.get('category'))?params.get('category'):'all',subcategory:categories.flatMap(c=>c.children).some(c=>c.id===params.get('subcategory'))?params.get('subcategory'):'all',verified:params.get('verified')==='verified'?'verified':'all',purpose:['time','focus','carry'].includes(params.get('purpose'))?params.get('purpose'):'all',sort:params.get('sort')==='name'?'name':'editor'};
    }
    if(!parts.length)home();
    else if(parts[0]==='products'){
      main.innerHTML=`<div class="listing-page"><div class="breadcrumbs"><a href="#/">ホーム</a><span>/</span><span>商品を探す</span></div>${listingMarkup()}</div>`;setupListing();title='商品を探す';
    }else if(parts[0]==='product'&&byId(parts[1])){productPage(byId(parts[1]));title=byId(parts[1]).name;}
    else if(parts[0]==='articles'){articlesPage(params);title='読みもの';}
    else if(parts[0]==='article'&&articles.some(a=>a.id===parts[1])){const a=articles.find(a=>a.id===parts[1]);articlePage(a);title=a.title.replace('\n','');}
    else if(['about','policy','privacy'].includes(parts[0])){infoPage(parts[0]);title={about:'商店について',policy:'広告・編集方針',privacy:'プライバシー'}[parts[0]];}
    else{main.innerHTML='<section class="empty-state section"><p class="eyebrow">PAGE NOT FOUND</p><h1>こちらの棚は、見つかりませんでした。</h1><a class="button dark" href="#/">商店のホームへ戻る →</a></section>';title='ページが見つかりません';}
    document.title=`${title}｜リズムスピーカー商店`;
    updateCompare();window.scrollTo(0,0);main.focus({preventScroll:true});
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    switch(b.dataset.action){
      case 'skip-main':e.preventDefault();main.focus();main.scrollIntoView();break;
      case 'toggle-compare':toggleCompare(b.dataset.id);break;
      case 'compare':openCompare(b);break;
      case 'close-compare':dialog.close();break;
      case 'category':filter.category=b.dataset.category;filter.subcategory='all';setupSubcategories();document.querySelectorAll('.category-tabs button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});drawProducts();syncFilters();break;
      case 'reset-filters':filter=emptyFilters();$('#search-input').value='';setupSubcategories();$('#verified-filter').value='all';$('#purpose-filter').value='all';$('#sort-filter').value='editor';document.querySelectorAll('.category-tabs button').forEach(x=>{const active=x.dataset.category==='all';x.classList.toggle('active',active);x.setAttribute('aria-pressed',active);});drawProducts();syncFilters();$('#search-input').focus();break;
      case 'article-filter':articleFilter.category=b.dataset.category;drawArticles();break;
      case 'reset-articles':articleFilter={q:'',category:'all'};$('#article-search-input').value='';drawArticles();break;
      case 'article-section':document.getElementById(b.dataset.section)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});break;
      case 'compare-pair':compare=b.dataset.ids.split(',').filter(id=>byId(id)).slice(0,3);try{localStorage.setItem('rs-shop-compare-v1',JSON.stringify(compare));}catch(_){}updateCompare();openCompare(b);break;
    }
  });
  window.addEventListener('hashchange',route);
  route();
})();
