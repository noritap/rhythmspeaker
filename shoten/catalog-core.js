/* Shared, dependency-free catalog rules. No network, publishing, credentials or runtime queue. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CatalogCore = api;
})(typeof window === 'object' ? window : globalThis, function() {
  'use strict';
  const UNKNOWN = 'UNKNOWN';
  const clone = value => JSON.parse(JSON.stringify(value));
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ja').replace(/[＋+\s・ー-]/g, '');
  const dateOK = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  const asinOK = value => typeof value === 'string' && /^[A-Z0-9]{10}$/.test(value);
  function safeURL(value, hosts) {
    try {
      const u = new URL(value);
      if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
      if (hosts && !hosts.includes(u.hostname)) return null;
      if ([...u.searchParams.keys()].some(k => /^(token|api[_-]?key|access[_-]?token|password|secret|signature)$/i.test(k))) return null;
      return u;
    } catch (_) { return null; }
  }
  function amazonIdentity(value) {
    const u = safeURL(value, ['amazon.co.jp', 'www.amazon.co.jp', 'amzn.to']);
    if (!u) return {status:'INVALID', asin:null};
    if (u.hostname === 'amzn.to') return {status:'RESOLUTION_REQUIRED', asin:null};
    const m = u.pathname.match(/^\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i);
    if (!m || /%|\\/.test(u.pathname)) return {status:'PRODUCT_URL_REQUIRED', asin:null};
    return {status:'IDENTIFIED', asin:m[1].toUpperCase(), canonical_url:`https://www.amazon.co.jp/dp/${m[1].toUpperCase()}`};
  }
  function amazonMediaErrors(p) {
    const m=p.media||{},errors=[];
    if(!safeURL(m.url,['m.media-amazon.com','images-na.ssl-images-amazon.com','images-fe.ssl-images-amazon.com'])) errors.push('Amazon画像は公式配信ドメインのhttps URLが必要です。');
    if(m.url&&safeURL(m.url)&&new URL(m.url).search) errors.push('Amazon画像URLの認証情報・クエリーは保持しません。');
    if(amazonIdentity(p.links?.amazon_url).asin!==p.asin) errors.push('Amazon画像のリンク先商品を照合してください。');
    if(m.acquired_via!=='CREATORS_API'||!m.evidence_ref||m.cache_policy!=='REMOTE_URL_ONLY') errors.push('Amazon画像の公式取得記録・URL参照方式を確認してください。');
    if(m.usage_state!=='VERIFIED'||p.identity_state!=='VERIFIED'||!asinOK(p.asin)||m.asin!==p.asin) errors.push('Amazon画像と照合済みASINが一致しません。');
    if(!Number.isInteger(m.width)||m.width<1||!Number.isInteger(m.height)||m.height<1) errors.push('Amazon画像の縦横寸法が必要です。');
    const fetched=Date.parse(m.fetched_at),expires=Date.parse(m.expires_at);
    if(!Number.isFinite(fetched)||!Number.isFinite(expires)||expires<=fetched||expires-fetched>3600000) errors.push('Amazon画像URLの更新期限は取得から1時間以内に設定してください。');
    return errors;
  }
  function mediaFor(p,now=Date.now()) {
    const m=p.media||{};
    if(m.type==='AMAZON_API_IMAGE') {
      if(amazonMediaErrors(p).length)return {mode:'ILLUSTRATION',reason:'RIGHTS_PENDING'};
      if(now<Date.parse(m.fetched_at)||now>=Date.parse(m.expires_at))return {mode:'ILLUSTRATION',reason:'REFRESH_REQUIRED'};
      return {mode:'AMAZON_IMAGE',url:m.url,width:m.width,height:m.height,label:'Amazon提供の商品画像',amazon_url:p.links.amazon_url};
    }
    if(m.url&&m.usage_state==='VERIFIED'&&['OWN_PHOTO','LICENSED_PHOTO'].includes(m.type))return {mode:'LOCAL_PHOTO',url:m.url,label:'使用許諾確認済みの写真'};
    return {mode:'ILLUSTRATION',reason:'PHOTO_PENDING'};
  }
  function ownerReferenceMedia(p,references,release) {
    if(release?.audience!=='OWNER_ONLY'||release?.general_public_release_approved!==false||release?.owner_reference_photos!==true)return null;
    const ref=references?.find(x=>x.product_id===p.product_id&&x.model===p.model);
    if(!ref||ref.release_approved!==false||ref.rights_state!=='UNKNOWN'||ref.source_kind!=='MANUFACTURER')return null;
    const hosts=['www.switchbot.jp','www.sony.jp','www.ankerjapan.com','www.audio-technica.co.jp'];
    if(!safeURL(ref.image_url,hosts)||!safeURL(ref.source_page,hosts))return null;
    if(new URL(ref.image_url).hostname!==new URL(ref.source_page).hostname)return null;
    return {mode:'OWNER_REFERENCE',url:ref.image_url,label:'メーカー公式の参照写真',source:ref.source_page,commercial_rights:'UNKNOWN',quality:ref.quality_state||'REFERENCE',note:ref.variant_note||''};
  }
  function parseIntake(input, kind, catalog) {
    if (typeof input !== 'string' || !input.trim() || input.length > 2000) throw Error('商品名・URL・カテゴリー・用途を入力してください。');
    let text=input.trim(), mode='ADD';
    if (/^商店を改善して[。\s]*$/.test(text)) return {mode:'IMPROVE',kind:'CATALOG',query:'',network_executed:false};
    if (/^商店の商品調査[：:]/.test(text)) { mode='RESEARCH'; text=text.replace(/^商店の商品調査[：:]\s*/, ''); }
    else text=text.replace(/^商店に追加[：:]\s*/, '');
    if (!text) throw Error('対象を入力してください。');
    const isURL=/^https?:\/\//i.test(text);
    const categories=(catalog?.categories||[]).flatMap(c=>[c,...c.children||[]]);
    const categoryMatch=categories.find(c=>c.id===text || normalize(c.name)===normalize(text) || mode==='RESEARCH'&&normalize(c.name).includes(normalize(text)));
    const chosen=kind || (isURL?'URL':categoryMatch?'CATEGORY':mode==='RESEARCH'?'PURPOSE':'NAME');
    if (!['URL','NAME','CATEGORY','PURPOSE'].includes(chosen)) throw Error('受付種別が不正です。');
    const identity=chosen==='URL'?amazonIdentity(text):{status:UNKNOWN,asin:null};
    if (chosen==='URL' && identity.status==='INVALID') throw Error('httpsのAmazon.co.jp商品URLを指定してください。');
    return {mode,kind:chosen,query:text,identity,network_executed:false};
  }
  function validateProduct(p, catalog) {
    const errors=[];
    if (!p || typeof p !== 'object' || Array.isArray(p)) return ['商品レコードが不正です。'];
    const fields=['product_id','record_version','asin','brand','formal_name','model','category','description','audience','recommendation_reasons','cautions','experience_state','sources','media','links','last_checked_at','publication','display','research','qa'];
    for(const key of fields) if(!(key in p)) errors.push(`必須フィールド: ${key}`);
    if(!/^[a-z][a-z0-9-]{1,63}$/.test(p.product_id||'')) errors.push('商品IDが不正です。');
    if(!Number.isInteger(p.record_version)||p.record_version<1) errors.push('レコード版が不正です。');
    if(p.asin!==null&&!asinOK(p.asin)) errors.push('ASINは10桁英数字、未確認時はnullです。');
    for(const key of ['brand','formal_name','model','description','audience']) if(typeof p[key]!=='string'||!p[key].trim()) errors.push(`${key}を入力してください。`);
    const cat=catalog?.categories?.find(c=>c.id===p.category?.primary);
    if(!cat || !cat.children.some(c=>c.id===p.category?.secondary)) errors.push('大分類と小分類の組合せが不正です。');
    if(!['OWNED','USED','VERIFIED_SELECTION','RESEARCH_ONLY'].includes(p.experience_state)) errors.push('使用経験区分が不正です。');
    const editorialText=[p.description,p.audience,...Array.isArray(p.recommendation_reasons)?p.recommendation_reasons:[],...Array.isArray(p.cautions)?p.cautions:[],p.display?.eyebrow,...Array.isArray(p.display?.tags)?p.display.tags:[]].join(' ');
    if(p.experience_state==='RESEARCH_ONLY' && /愛用品|実際に使って|使ってみた|使用してみた|私が使用|古庄が使用/.test(editorialText)) errors.push('未使用商品の使用レビュー表現は登録できません。');
    if(!['ACTIVE','CANDIDATE','HOLD','KILL'].includes(p.recommendation)) errors.push('推薦状態が不正です。');
    if(!Array.isArray(p.sources)||!p.sources.length||p.sources.some(s=>!s||!safeURL(s.url)||!s.source_id||!s.label||!dateOK(s.checked_at))) errors.push('出典URL・確認日が不正です。');
    if(!Array.isArray(p.sources)||!p.sources.some(s=>s?.type==='MANUFACTURER')) errors.push('メーカー公式の確認元が必要です。');
    if(!dateOK(p.last_checked_at)) errors.push('確認日が不正です。');
    if(!['VERIFIED','UNKNOWN'].includes(p.identity_state)) errors.push('商品照合状態が不正です。');
    if(p.identity_state==='VERIFIED' && (!asinOK(p.asin)||!p.links?.amazon_url)) errors.push('照合済み商品にはASINと確認済み商品URLが必要です。');
    if(!['UNKNOWN','LINK_PENDING','VERIFIED','INVALID'].includes(p.links?.affiliate_status)) errors.push('紹介リンク状態が不正です。');
    if(p.links?.affiliate_status==='VERIFIED' && !p.links.affiliate_url) errors.push('確認済み紹介リンクのURLが空です。');
    if(typeof p.publication?.approved!=='boolean') errors.push('掲載承認は真偽値で指定してください。');
    if(p.media?.usage_state==='VERIFIED' && !p.media.evidence_ref) errors.push('画像利用方法の確認根拠が必要です。');
    if(!p.display || !p.display.specs || !p.display.comparison || !Array.isArray(p.display.tags) || !['time','focus','carry'].includes(p.display.purpose)) errors.push('商品表示データが不正です。');
    if(['name','kind','eyebrow','image','tint','highlight','article'].some(k=>typeof p.display?.[k]!=='string'||!p.display[k].trim())) errors.push('表示用名称・画像区分・仕様の項目が不足しています。');
    if(!['vacuum-white','vacuum-black','headphones-cream','headphones-black','power-ac','power-dc'].includes(p.display?.image)) errors.push('説明用画像の種類が不正です。');
    if(!Array.isArray(p.related_product_ids)||!Array.isArray(p.alternatives)) errors.push('関連・代替商品は配列で指定してください。');
    if(Array.isArray(p.alternatives)&&p.alternatives.some(a=>!safeURL(a?.url)||!a.name||!a.note||!Array.isArray(p.sources)||!p.sources.some(s=>s.source_id===a.source_id))) errors.push('代替商品の出典・説明が不正です。');
    if(!Array.isArray(p.recommendation_reasons)||!p.recommendation_reasons.length||!Array.isArray(p.cautions)||!p.cautions.length) errors.push('推薦理由と注意点が必要です。');
    for(const key of ['amazon_url','affiliate_url']) if(p.links?.[key]!==null && !safeURL(p.links?.[key],['amazon.co.jp','www.amazon.co.jp','amzn.to'])) errors.push(`${key}が不正です。`);
    if(p.links?.amazon_url){const id=amazonIdentity(p.links.amazon_url);if(id.status!=='IDENTIFIED'||p.asin!==id.asin) errors.push('通常リンクとASINが一致しません。');if(new URL(p.links.amazon_url).searchParams.has('tag')) errors.push('通常リンクに追跡タグは付けられません。');}
    if(p.links?.affiliate_url && p.links.affiliate_status==='VERIFIED') {
      if(p.identity_state!=='VERIFIED') errors.push('紹介リンクの有効化には商品の照合が必要です。');
      const u=safeURL(p.links.affiliate_url,['amazon.co.jp','www.amazon.co.jp']);
      if(!u || amazonIdentity(p.links.affiliate_url).asin!==p.asin || !p.links.tracking_id || u.searchParams.get('tag')!==p.links.tracking_id) errors.push('紹介リンク・ASIN・Tracking IDの一致を確認してください。');
      if(!['SITE_STRIPE','CREATORS_API'].includes(p.links.acquired_via)||!dateOK(p.links.checked_at)||!p.links.evidence_ref) errors.push('公式リンク取得の検証記録が必要です。');
    }
    if(p.media?.type==='AMAZON_API_IMAGE') errors.push(...amazonMediaErrors(p));
    else if(p.media?.url) {
      {
        if(!['OWN_PHOTO','LICENSED_PHOTO'].includes(p.media.type) || p.media.usage_state!=='VERIFIED' || !p.media.evidence_ref) errors.push('商品写真の使用許諾・出典が未確認です。');
        if(!/^\.\/assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|svg)$/.test(p.media.url)||p.media.url.includes('..')) errors.push('写真は許諾確認済みの同梱アセットを指定してください。');
      }
    }
    if(!['PREVIEW_ONLY','DRAFT','READY','PUBLISHED','HOLD','ARCHIVED'].includes(p.publication?.state)) errors.push('掲載状態が不正です。');
    const duplicates=catalog?.products?.filter(x=>x.product_id!==p.product_id && p.asin && x.asin===p.asin)||[];
    if(duplicates.length) errors.push(`同じASINが登録済みです: ${duplicates[0].product_id}`);
    return errors;
  }
  function validateCatalog(catalog) {
    if(!catalog || catalog.schema_version!=='1.0.0'||!Number.isInteger(catalog.revision)||!Array.isArray(catalog.products)||!Array.isArray(catalog.categories)) return ['商品マスターの形式が不正です。'];
    const errors=[], ids=new Set(), asins=new Set();
    for(const p of catalog.products) {
      if(ids.has(p.product_id))errors.push(`商品ID重複: ${p.product_id}`);ids.add(p.product_id);
      if(p.asin && asins.has(p.asin))errors.push(`ASIN重複: ${p.asin}`);if(p.asin)asins.add(p.asin);
      errors.push(...validateProduct(p,catalog).map(e=>`${p.product_id}: ${e}`));
    }
    for(const p of catalog.products)for(const id of p.related_product_ids||[])if(!ids.has(id)||id===p.product_id) errors.push(`${p.product_id}: 関連商品の参照が不正です。`);
    return [...new Set(errors)];
  }
  function proposeUpsert(catalog, record, options={}) {
    if(options.expected_catalog_revision!==catalog.revision) throw Error('マスター版が変わっています。読み直してください。');
    const errors=validateProduct(record,catalog);if(errors.length)throw Error(errors.join(' / '));
    const existing=catalog.products.find(p=>p.product_id===record.product_id);
    if(options.mode==='create' && existing)throw Error('登録済み商品です。新規登録による上書きはできません。');
    if(!['create','update'].includes(options.mode))throw Error('create / updateを明示してください。');
    if(options.mode==='update') {
      if(!existing)throw Error('更新対象がありません。');
      if(options.expected_record_version!==existing.record_version)throw Error('商品版が変わっています。上書きを中止しました。');
      if(existing.asin && record.asin!==existing.asin)throw Error('既存ASINは変更できません。別モデルとして登録してください。');
      if(existing.brand!==record.brand||existing.model!==record.model)throw Error('ブランド・型番の差し替えはできません。別モデルとして登録してください。');
    }
    const out=clone(catalog), next=clone(record);
    next.publication.state='PREVIEW_ONLY';next.publication.approved=false;
    if(existing){next.record_version=existing.record_version+1;out.products[out.products.findIndex(p=>p.product_id===next.product_id)]=next;}else out.products.push(next);
    out.revision++;
    const all=validateCatalog(out);if(all.length)throw Error(all.join(' / '));
    return {catalog:out,operation:{kind:options.mode,product_id:next.product_id,record_version:next.record_version,published:false,remote_write:false}};
  }
  function readiness(p,catalog) {
    const structural=validateProduct(p,catalog);
    const sourceTypes=new Set((p.sources||[]).map(s=>s.type));
    const linkOK=p.links?.affiliate_status==='VERIFIED'&&!!p.links.affiliate_url&&!structural.some(s=>/リンク|Tracking/.test(s));
    const qaCurrent=p.qa?.record_version===p.record_version;
    const normalQA=qaCurrent&&p.qa.mobile==='PASS'&&p.qa.standard_link==='PASS';
    const allLinkQA=normalQA&&linkOK&&p.qa.affiliate_link==='PASS';
    const items=[
      ['受付','PASS','商品候補・用途を記録'],
      ['商品・ASIN特定',p.identity_state==='VERIFIED'&&asinOK(p.asin)?'PASS':'HOLD','メーカー型番とAmazonの商品一致'],
      ['情報源照合',sourceTypes.has('MANUFACTURER')&&sourceTypes.has('AMAZON')&&p.identity_state==='VERIFIED'?'PASS':'HOLD','メーカーとAmazonの両方を確認'],
      ['仕様・利点・弱点',p.research?.facts==='VERIFIED'?'PASS':'HOLD','公式仕様と編集判断を分離'],
      ['類似・後継調査',p.research?.alternatives==='VERIFIED'?'PASS':'HOLD','同一モデルと後継機種を混同しない'],
      ['推薦理由・対象者',p.recommendation_reasons?.length&&p.audience?'PASS':'HOLD','実使用の捏造を避ける'],
      ['正規紹介リンク',linkOK?'PASS':'HOLD',linkOK?'公式取得の検証記録あり':'リンク確認待ち。既存IDを推測で付け足さない'],
      ['画像利用方法',p.media?.usage_state==='VERIFIED'?'PASS':'HOLD',p.media?.type==='ORIGINAL_ILLUSTRATION'?'オリジナルイラスト。商品写真は別途権利確認':'画像の出典・使用許諾を確認'],
      ['紹介データ作成',structural.length?'HOLD':'PASS',structural.length?structural.join(' / '):'必須項目・UNKNOWNの区別'],
      ['重複・上書き防止',structural.some(s=>/登録済み|重複/.test(s))?'HOLD':'PASS','商品ID・ASIN・商品版を検査'],
      ['掲載プレビュー',p.qa?.preview==='PASS'&&p.qa.record_version===p.record_version?'PASS':'NOT_RUN','対象商品版に一致した表示確認'],
      ['リンク・モバイル検証',allLinkQA?'PASS':normalQA?'PARTIAL':'NOT_RUN',allLinkQA?'通常リンク・紹介リンク・モバイルの確認済み':normalQA?'通常リンク・モバイルは確認済み。紹介リンクは未検証':'対象商品版のリンク・モバイル検証が未完了'],
      ['掲載先承認・反映',p.publication?.approved===true&&catalog.surface?.registered==='VERIFIED'&&catalog.surface?.release_approved===true?'APPROVED_NOT_DEPLOYED':'APPROVAL_REQUIRED','今回は配信版を更新しない。反映後の確認は未実施'],
      ['検証記録',p.research?.audit_ref?'PASS':'NOT_RUN','既存REV-009へ渡す検証記録。第二の実行キューは作らない']
    ];
    const steps=items.map(([label,status,note],i)=>({step:i+1,label,status,note}));
    steps[11].checks={record_version_current:qaCurrent,mobile:qaCurrent?p.qa.mobile:'NOT_RUN',standard_link:qaCurrent?p.qa.standard_link:'NOT_RUN',affiliate_link:qaCurrent&&linkOK?p.qa.affiliate_link:'NOT_RUN'};
    return {product_id:p.product_id,asin:p.asin,steps,ready_for_preview:structural.length===0,ready_for_release:false};
  }
  function target(p,surface) {
    const link=p.links||{};
    if(p.identity_state==='VERIFIED'&&asinOK(p.asin)&&link.affiliate_status==='VERIFIED'&&link.affiliate_url&&surface?.registered==='VERIFIED'&&surface?.release_approved===true&&p.publication?.approved===true) {
      const u=safeURL(link.affiliate_url,['amazon.co.jp','www.amazon.co.jp']);
      if(u && amazonIdentity(link.affiliate_url).asin===p.asin && u.searchParams.get('tag')===link.tracking_id && ['SITE_STRIPE','CREATORS_API'].includes(link.acquired_via) && link.evidence_ref && dateOK(link.checked_at))return {href:link.affiliate_url,kind:'AFFILIATE',label:'広告｜Amazonで商品を見る',rel:'noopener noreferrer sponsored',note:'広告リンクです。適格販売により当サイトが紹介料を得る場合があります。'};
    }
    if(p.identity_state==='VERIFIED'&&asinOK(p.asin)&&link.amazon_url&&amazonIdentity(link.amazon_url).asin===p.asin&&!new URL(link.amazon_url).searchParams.has('tag')) return {href:link.amazon_url,kind:'AMAZON_STANDARD',label:'Amazonで商品を見る',rel:'noopener noreferrer',note:'確認済みの商品ページへの通常リンクです。紹介料は発生しません。'};
    const u=new URL('https://www.amazon.co.jp/s');u.searchParams.set('k',`${p.brand} ${p.model}`);
    return {href:u.href,kind:'AMAZON_SEARCH',label:'Amazonで型番を探す',rel:'noopener noreferrer',note:'商品照合待ちのため検索結果を開きます。紹介料は発生しません。'};
  }
  function filterProducts(products, filter) {
    const terms=String(filter.q||'').trim().split(/\s+/).filter(Boolean).map(normalize);
    const items=products.filter(p=>(!filter.category||filter.category==='all'||p.category===filter.category)&&(!filter.subcategory||filter.subcategory==='all'||p.subcategory===filter.subcategory)&&(!filter.purpose||filter.purpose==='all'||p.purpose===filter.purpose)&&(!filter.verified||filter.verified==='all'||p.identity_state==='VERIFIED')&&terms.every(t=>normalize([p.name,p.brand,p.category_name,p.subcategory_name,p.kind,p.summary,p.good,p.caution,p.asin||'',p.model,...Object.values(p.specs),...p.tags].join(' ')).includes(t)));
    return filter.sort==='name'?items.slice().sort((a,b)=>a.name.localeCompare(b.name,'ja')):items;
  }
  function toRevenueOS(catalog) {
    const errors=validateCatalog(catalog);if(errors.length)throw Error(errors.join(' / '));
    return {source_contract:catalog.strategy.contract,source_revision:catalog.revision,remote_write:false,queue_created:false,products:catalog.products.map(p=>{
      const purchase=target(p,catalog.surface),activeLink=purchase.kind==='AFFILIATE';
      return {product_id:p.product_id,amazon_product_id:p.identity_state==='VERIFIED'?p.asin:null,asin:p.identity_state==='VERIFIED'?p.asin:null,name:p.formal_name,brand:p.brand,cluster:null,category:p.category.primary+'/'+p.category.secondary,experience_state:p.experience_state,recommendation_state:p.recommendation,affiliate_tracking_id:activeLink?p.links.tracking_id:null,affiliate_url:activeLink?purchase.href:null,official_source_state:'UNKNOWN',availability_state:p.availability_state,price_display_mode:catalog.price_display,last_checked_at:p.last_checked_at,score:null,notes:'表示正本からの読取専用の変換。cluster・鮮度区分・scoreは未判定。掲載状態='+p.publication.state+'、紹介リンク='+p.links.affiliate_status+'。収益実績は含まない。'};
    })};
  }
  return {UNKNOWN,normalize,asinOK,safeURL,amazonIdentity,parseIntake,validateProduct,validateCatalog,proposeUpsert,readiness,target,filterProducts,toRevenueOS,mediaFor,amazonMediaErrors,ownerReferenceMedia};
});
