(function () {
  'use strict';

  const editorial = window.SHOTEN_EDITORIAL;
  const core = window.CatalogCore;

  function adapt(row) {
    const category = editorial.categories.find(c => c.id === row.category);
    const subcategory = category?.children.find(c => c.id === row.subcategory);
    const link = core.safeURL(row.href, ['amazon.co.jp', 'www.amazon.co.jp']);
    const shortAffiliate = row.affiliateLinkKind === 'AMAZON_OFFICIAL_SHORT' &&
      row.ownerVerifiedShortLink === true &&
      /^https:\/\/link\.amazon\/[A-Za-z0-9]+$/.test(row.href) &&
      /^[A-Z0-9]{10}$/.test(row.asin) &&
      (row.trackingId == null || /^[A-Za-z0-9_-]+-22$/.test(row.trackingId));
    const directAffiliate = !!link && core.amazonIdentity(row.href).asin === row.asin &&
      link.searchParams.getAll('tag').length === 1 && !!link.searchParams.get('tag');
    if (!subcategory || !/^RS-P\d{4,}$/.test(row.product_id) ||
        !(directAffiliate || shortAffiliate)) {
      throw Error('Invalid Shoten catalog row');
    }
    const validPhoto = value => value === 'https://jp.shokz.com/cdn/shop/files/openfit-pro-white-1_9f85b1d8-f0e5-4c73-988c-b4f029ac1219.webp?v=1775196197&width=900' || value === 'https://www.ankerjapan.com/cdn/shop/files/A2687141.png?crop=center&height=900&v=1762316684&width=900' || value === 'https://www.switchbot.jp/cdn/shop/files/3396_1x_515460ae-4cf1-4cdd-8b7b-3483e7e72b49_700x700.webp?v=1764836422' || value === 'https://jp.ecoflow.com/cdn/shop/files/D3C_1200_1200.png?v=1780393161' || /^\.\/assets\/products\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif|svg)$/.test(value) || /^https:\/\/(?:www\.pbtech\.co\.nz\/imgprod\/|www\.jbhifi\.com\.au\/cdn\/shop\/products\/|bf1af2\.akinoncloudcdn\.com\/products\/|cdn\.shopify\.com\/|jp\.shokz\.com\/|www\.switchbot\.jp\/|www\.ankerjapan\.com\/|jp\.ecoflow\.com\/|www\.elleair\.jp\/|www\.kao-kirei\.com\/|www\.audio-technica\.co\.jp\/|m\.media-amazon\.com\/|www\.jbhifi\.co\.nz\/|monoaru\.shop\/|tshop\.r10s\.jp\/)[A-Za-z0-9_./?=&%-]+$/.test(value);
    if (row.approvedPhoto !== null && !validPhoto(row.approvedPhoto)) throw Error('Invalid approved photo URL');
    if (row.gallery !== undefined && (!Array.isArray(row.gallery) || row.gallery.length > 5 || row.gallery.some(item => !item || typeof item.alt !== 'string' || !validPhoto(item.src)))) throw Error('Invalid product gallery');
    const purchase = {
      kind:'AFFILIATE', href:row.href, label:'Amazonで商品を見る', rel:'noopener sponsored',
      note:'広告リンクです。適格販売により当店が紹介料を得る場合があります。'
    };
    return {
      ...row,
      id:row.product_id, canonicalId:row.product_id, name:row.model,
      category_name:category.name, subcategory_name:subcategory.name, identity_state:'VERIFIED',
      master:{recommendation_reasons:row.reasons,sources:row.sources}, relatedIds:[], alternatives:[],
      source:row.sources[0].url, purchase
    };
  }

  async function loadShop() {
    let products = [];
    let features = [];
    let loadState = 'READY';
    try {
      const response = await fetch('./catalog.json', {cache:'no-cache'});
      if (!response.ok) throw Error('Cannot load Shoten catalog');
      const snapshot = await response.json();
      if (snapshot.schema_version !== 1 || snapshot.surface !== 'rhythmspeaker-web' ||
          !Array.isArray(snapshot.products)) throw Error('Unsupported Shoten catalog');
      products = snapshot.products.flatMap(row => {
        try { return [adapt(row)]; } catch { return []; }
      });
      if (products.length && products.length < snapshot.products.length) loadState = 'PARTIAL';
      if (snapshot.products.length && !products.length) throw Error('No valid Shoten catalog rows');
      if (new Set(products.map(p => p.id)).size !== products.length) throw Error('Duplicate Shoten product');
      features = (Array.isArray(snapshot.features) ? snapshot.features : []).flatMap(f => {
        if (!f || typeof f.feature_id !== 'string' || typeof f.title !== 'string' || !Array.isArray(f.product_ids)) return [];
        const ids = f.product_ids.filter(id => products.some(p => p.id === id));
        if (!ids.length) return [];
        return [{ feature_id: f.feature_id, title: f.title,
          kind: typeof f.kind === 'string' ? f.kind : 'SALE',
          label: typeof f.label === 'string' ? f.label : '',
          intro: typeof f.intro === 'string' ? f.intro : '',
          start_date: f.start_date, end_date: f.end_date, product_ids: ids }];
      }).slice(0, 3);
    } catch {
      products = [];
      loadState = 'ERROR';
    }

    for (const product of products) {
      product.relatedIds = products.filter(p => p.id !== product.id && p.category === product.category).map(p => p.id);
    }
    const links = {'daily-handsoap-4l':['RS-P0050'],'headphones-commute-choice':['RS-P0002','RS-P0005','RS-P0012'],'portable-power-first-check':['RS-P0014'],'smartplug-first-home':['RS-P0015'],'mct-oil-quantity-choice':['RS-P0031'],'robot-vacuum':['RS-P0001'],'headphones':['RS-P0002','RS-P0005','RS-P0012','RS-P0013'],'portable-power':['RS-P0014']};
    const articles = editorial.articles.map(a=>({...a,products:(a.products?.length?a.products:(links[a.id]||[])).filter(id=>products.some(p=>p.id===id))}));
    try {
      const res = await fetch('./blog-feed.json',{cache:'no-cache'});
      if (res.ok) {
        const feed = await res.json();
        if (feed.schema_version===1 && Array.isArray(feed.entries)) {
          for (const entry of feed.entries.slice(0,40)) {
            if (!entry || typeof entry.title!=='string' || !/^https:\/\/rhythmspeaker\.hatenablog\.com\/entry\//.test(entry.url)) continue;
            const ids = Array.isArray(entry.product_ids)?entry.product_ids.filter(id=>products.some(p=>p.id===id)):[];
            articles.push({id:'hatena-'+encodeURIComponent(entry.url.split('/').pop()),category:products.find(p=>ids.includes(p.id))?.category||'all',type:'ブログ',title:entry.title,excerpt:entry.summary||'タプ太郎の毎日ブログで続きを読む。',time:3,art:'editor',products:ids,lead:'',sections:[],last_checked_at:entry.published||'',externalUrl:entry.url,feature:false});
          }
        }
      }
    } catch (_) { /* Keep the curated articles available. */ }
    return {...editorial, products, articles, features, loadState};
  }

  window.SHOTEN_READY = loadShop();
})();
