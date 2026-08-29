(() => {
  if (!window.RSStore || !window.supabase) return;
  const originalGet = window.RSStore.get.bind(window.RSStore);
  let cached;

  const isUuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  const normalize = e => ({
    id:e.id, slug:e.slug, title:e.title, subtitle:e.subtitle||'', instructor:e.instructor||'',
    instructorProfile:e.instructor_profile||'', instructorImageUrl:e.instructor_image_url||'', date:e.date,
    venue:e.venue||'', address:e.address||'', summary:e.summary||'', description:e.description||'',
    targetAudience:e.target_audience||'', highlights:e.highlights||'',
    bringItems:Array.isArray(e.bring_items)?e.bring_items:[], faq:Array.isArray(e.faq)?e.faq:[],
    cancellationPolicy:e.cancellation_policy||'', contactNote:e.contact_note||'', registrationCloseAt:e.registration_close_at||'',
    flyerUrl:e.flyer_url||e.cover||'', cover:e.flyer_url||e.cover||'', gallery:Array.isArray(e.gallery)?e.gallery:[],
    status:e.status, paymentNote:e.payment_note||'', createdAt:e.created_at,
    sessions:(e.workshop_sessions||[]).filter(s=>s.active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(s=>({
      id:s.id,name:s.name,start:s.start_time||'',end:s.end_time||'',minutes:s.minutes,price:s.price,capacity:s.capacity,
      level:s.level||'',paymentUrl:s.payment_url||'',consumes:s.consumes||[]
    }))
  });

  window.RSStore.get = async () => {
    if (cached) return cached;
    const base = await originalGet();
    if (window.RSStore.config.mode !== 'live') return base;
    const cfg = window.RSStore.config;
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);

    cached = {
      ...base,
      mode:'live',
      async listEvents({publishedOnly=false}={}){
        let q=client.from('workshop_events').select('*,workshop_sessions(*)').order('date',{ascending:true});
        if(publishedOnly) q=q.eq('status','published');
        const {data,error}=await q; if(error) throw error; return (data||[]).map(normalize);
      },
      async getEventBySlug(slug){
        const {data,error}=await client.from('workshop_events').select('*,workshop_sessions(*)').eq('slug',slug).maybeSingle();
        if(error) throw error; return data?normalize(data):null;
      },
      async saveEvent(event){
        const row={
          id:event.id||undefined,slug:event.slug,title:event.title,subtitle:event.subtitle||null,instructor:event.instructor||null,
          instructor_profile:event.instructorProfile||null,instructor_image_url:event.instructorImageUrl||null,date:event.date,
          venue:event.venue||null,address:event.address||null,summary:event.summary||null,description:event.description||null,
          target_audience:event.targetAudience||null,highlights:event.highlights||null,bring_items:event.bringItems||[],faq:event.faq||[],
          cancellation_policy:event.cancellationPolicy||null,contact_note:event.contactNote||null,registration_close_at:event.registrationCloseAt||null,
          flyer_url:event.flyerUrl||event.cover||null,cover:event.flyerUrl||event.cover||null,gallery:event.gallery||[],status:event.status,
          payment_note:event.paymentNote||null
        };
        const saved=await client.from('workshop_events').upsert(row).select().single(); if(saved.error) throw saved.error;
        const eventId=saved.data.id;
        const existing=await client.from('workshop_sessions').select('id').eq('event_id',eventId); if(existing.error) throw existing.error;
        const idMap=new Map();
        const prepared=(event.sessions||[]).map(s=>{const id=isUuid(s.id)?s.id:crypto.randomUUID();idMap.set(s.id,id);return {...s,id};});
        const keep=new Set(prepared.map(s=>s.id));
        for(const x of existing.data||[]){if(!keep.has(x.id)){const r=await client.from('workshop_sessions').update({active:false}).eq('id',x.id);if(r.error)throw r.error;}}
        if(prepared.length){
          const rows=prepared.map((s,i)=>({id:s.id,event_id:eventId,name:s.name,start_time:s.start||null,end_time:s.end||null,
            minutes:Number(s.minutes||0),price:Number(s.price||0),capacity:Number(s.capacity||10),level:s.level||null,payment_url:s.paymentUrl||null,
            consumes:(s.consumes||[]).map(x=>idMap.get(x)||x).filter(isUuid),active:true,sort_order:i}));
          const r=await client.from('workshop_sessions').upsert(rows); if(r.error) throw r.error;
        }
        return {...event,id:eventId,sessions:prepared};
      },
      async deleteEvent(id){const r=await client.from('workshop_events').update({status:'archived'}).eq('id',id);if(r.error)throw r.error;},
      async duplicateEvent(id){
        const src=(await this.listEvents()).find(e=>e.id===id); if(!src) throw new Error('イベントが見つかりません');
        const stamp=Date.now(),copy=structuredClone(src); copy.id=crypto.randomUUID();copy.slug=`${src.slug}-copy-${stamp}`;copy.title=`${src.title} コピー`;copy.status='draft';
        const m=new Map(copy.sessions.map(s=>[s.id,crypto.randomUUID()]));copy.sessions=copy.sessions.map(s=>({...s,id:m.get(s.id),consumes:(s.consumes||[]).map(x=>m.get(x)).filter(Boolean)}));
        return this.saveEvent(copy);
      },
      async signUp(email,password){const {data,error}=await client.auth.signUp({email,password});if(error)throw error;return data.user;},
      async uploadImage(file,folder='events'){
        if(!file) throw new Error('画像を選択してください');
        if(file.size>10*1024*1024) throw new Error('画像は10MB以下にしてください');
        const allowed=new Set(['image/jpeg','image/png','image/webp']); if(!allowed.has(file.type)) throw new Error('JPEG / PNG / WebP画像を使用してください');
        const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
        const path=`${folder}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
        const up=await client.storage.from(cfg.storageBucket||'workshop-media').upload(path,file,{upsert:false,contentType:file.type});if(up.error)throw up.error;
        return client.storage.from(cfg.storageBucket||'workshop-media').getPublicUrl(path).data.publicUrl;
      },
      async uploadCover(file){return this.uploadImage(file,'flyers');}
    };
    return cached;
  };
})();
