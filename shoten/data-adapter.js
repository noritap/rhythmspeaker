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
      /^[A-Za-z0-9_-]+-22$/.test(row.trackingId || '');
    const directAffiliate = !!link && core.amazonIdentity(row.href).asin === row.asin &&
      link.searchParams.getAll('tag').length === 1 && !!link.searchParams.get('tag');
    if (!subcategory || !/^RS-P\d{4,}$/.test(row.product_id) ||
        !(directAffiliate || shortAffiliate)) {
      throw Error('Invalid Shoten catalog row');
    }
    const validPhoto = value => /^\.\/assets\/products\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif|svg)$/.test(value) || /^https:\/\/(?:www\.pbtech\.co\.nz\/imgprod\/|www\.jbhifi\.com\.au\/cdn\/shop\/products\/|bf1af2\.akinoncloudcdn\.com\/products\/)[A-Za-z0-9_./?=&%-]+$/.test(value);
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
    let loadState = 'READY';
    try {
      const response = await fetch('./catalog.json', {cache:'no-cache'});
      if (!response.ok) throw Error('Cannot load Shoten catalog');
      const snapshot = await response.json();
      if (snapshot.schema_version !== 1 || snapshot.surface !== 'rhythmspeaker-web' ||
          !Array.isArray(snapshot.products)) throw Error('Unsupported Shoten catalog');
      products = snapshot.products.filter(row => row.publicationStatus !== 'LINK_PENDING').map(adapt);
      if (new Set(products.map(p => p.id)).size !== products.length) throw Error('Duplicate Shoten product');
    } catch {
      products = [];
      loadState = 'ERROR';
    }

    for (const product of products) {
      product.relatedIds = products.filter(p => p.id !== product.id && p.category === product.category).map(p => p.id);
    }
    const articles = editorial.articles.map(a => ({
      ...a, products:a.feature ? products.filter(p => p.category === a.category).map(p => p.id) : []
    }));
    return {...editorial, products, articles, loadState};
  }

  window.SHOTEN_READY = loadShop();
})();
