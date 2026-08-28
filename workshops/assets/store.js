(() => {
  const CFG = window.RS_WORKSHOP_CONFIG || { mode: "demo" };
  const KEYS = { events: "rswm_events_v1", reservations: "rswm_reservations_v1", admin: "rswm_admin_v1" };
  const NAOYUKI_SLUG = "naoyuki-2026-10-16";
  const NAOYUKI_COVER = "./assets/naoyuki-workshop-flyer.jpg";

  const seedEvent = {
    id: NAOYUKI_SLUG,
    slug: NAOYUKI_SLUG,
    title: "NAOYUKI TAP DANCE WORKSHOP",
    instructor: "NAOYUKI",
    date: "2026-10-16",
    venue: "池袋 リズムスピーカー",
    address: "東京都豊島区西池袋3-22-10 大晃第7ビル B1",
    summary: "タップダンスで、歴史を学び、音で表現する。",
    description: "一緒にタップダンス、踊りましょう。初心者から経験者まで参加できるワークショップです。",
    status: "published",
    cover: NAOYUKI_COVER,
    paymentNote: "当日支払いまたは運営指定の決済方法",
    createdAt: new Date().toISOString(),
    sessions: [
      { id: "beginner", name: "初級クラス", start: "18:00", end: "19:30", minutes: 90, price: 3500, capacity: 10, level: "初心者〜経験者歓迎", paymentUrl: "" },
      { id: "intermediate", name: "中級クラス", start: "20:00", end: "22:00", minutes: 120, price: 4000, capacity: 10, level: "どなたでも参加OK", paymentUrl: "" },
      { id: "set", name: "初級 + 中級セット", start: "18:00", end: "22:00", minutes: 210, price: 7000, capacity: 10, level: "2クラス通し", paymentUrl: "", consumes: ["beginner", "intermediate"] }
    ]
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const isNaoyuki = e => e && (e.id === NAOYUKI_SLUG || e.slug === NAOYUKI_SLUG);

  function normalizeNaoyuki(event) {
    if (!isNaoyuki(event)) return event;
    return {
      ...seedEvent,
      ...event,
      id: event.id || NAOYUKI_SLUG,
      slug: event.slug || NAOYUKI_SLUG,
      cover: NAOYUKI_COVER,
      sessions: Array.isArray(event.sessions) && event.sessions.length ? event.sessions : seedEvent.sessions
    };
  }

  function demoEvents() {
    return read(KEYS.events, []).map(normalizeNaoyuki);
  }

  function ensureSeed() {
    const existing = read(KEYS.events, []);
    if (!existing.length) {
      write(KEYS.events, [seedEvent]);
      return;
    }
    let found = false;
    const normalized = existing.map(event => {
      if (isNaoyuki(event)) found = true;
      return normalizeNaoyuki(event);
    });
    if (!found) normalized.unshift(seedEvent);
    write(KEYS.events, normalized);
  }
  ensureSeed();

  const demo = {
    mode: "demo",
    async listEvents({ publishedOnly = false } = {}) {
      const rows = demoEvents();
      return publishedOnly ? rows.filter(e => e.status === "published") : rows;
    },
    async getEventBySlug(slug) {
      const event = demoEvents().find(e => e.slug === slug || e.id === slug);
      return event || null;
    },
    async saveEvent(event) {
      const rows = demoEvents();
      const value = normalizeNaoyuki(event);
      const i = rows.findIndex(e => e.id === value.id);
      if (i >= 0) rows[i] = value; else rows.unshift(value);
      write(KEYS.events, rows);
      return value;
    },
    async deleteEvent(id) {
      write(KEYS.events, demoEvents().filter(e => e.id !== id));
    },
    async duplicateEvent(id) {
      const src = demoEvents().find(e => e.id === id);
      if (!src) throw new Error("イベントが見つかりません");
      const stamp = Date.now();
      const copy = structuredClone(src);
      copy.id = `${src.slug}-copy-${stamp}`;
      copy.slug = copy.id;
      copy.title = `${src.title} コピー`;
      copy.status = "draft";
      copy.createdAt = new Date().toISOString();
      copy.sessions = copy.sessions.map((s, i) => ({ ...s, id: `s${stamp}-${i}` }));
      const rows = demoEvents(); rows.unshift(copy); write(KEYS.events, rows); return copy;
    },
    async listReservations(eventId) {
      return read(KEYS.reservations, []).filter(r => !eventId || r.eventId === eventId);
    },
    async reserve(payload) {
      const event = await this.getEventBySlug(payload.eventSlug);
      if (!event) throw new Error("イベントが見つかりません");
      const session = event.sessions.find(s => s.id === payload.sessionId);
      if (!session) throw new Error("クラスが見つかりません");
      if (await this.remaining(event.id, session.id) <= 0) throw new Error("満席です");
      const reservation = {
        ...payload,
        id: `RS-${Date.now().toString(36).toUpperCase()}`,
        eventId: event.id,
        amount: session.price,
        paymentStatus: "unpaid",
        status: "reserved",
        checkin: false,
        createdAt: new Date().toISOString()
      };
      const rows = read(KEYS.reservations, []); rows.push(reservation); write(KEYS.reservations, rows); return reservation;
    },
    async updateReservation(id, patch) {
      const rows = read(KEYS.reservations, []);
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("予約が見つかりません");
      rows[i] = { ...rows[i], ...patch }; write(KEYS.reservations, rows); return rows[i];
    },
    async remaining(eventId, sessionId) {
      const event = demoEvents().find(e => e.id === eventId);
      if (!event) return 0;
      const session = event.sessions.find(s => s.id === sessionId);
      if (!session) return 0;
      const active = read(KEYS.reservations, []).filter(r => r.eventId === eventId && r.status !== "cancelled");
      const targets = session.consumes || [session.id];
      const used = active.filter(r => {
        const reservedSession = event.sessions.find(s => s.id === r.sessionId);
        const reservedTargets = reservedSession?.consumes || [r.sessionId];
        return reservedTargets.some(x => targets.includes(x));
      }).length;
      return Math.max(0, Number(session.capacity || 0) - used);
    },
    async signIn(email, password) {
      if (!email || !password) throw new Error("メールとパスワードを入力してください");
      const user = { email, at: Date.now() }; write(KEYS.admin, user); return user;
    },
    async signOut() { localStorage.removeItem(KEYS.admin); },
    async currentUser() { return read(KEYS.admin, null); },
    async uploadCover(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
      });
    }
  };

  let live;
  async function getLive() {
    if (live) return live;
    if (!window.supabase || !CFG.supabaseUrl || !CFG.supabasePublishableKey) throw new Error("Supabase設定がありません");
    const client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey);
    live = {
      mode: "live",
      async listEvents({ publishedOnly = false } = {}) {
        let q = client.from("workshop_events").select("*,workshop_sessions(*)").order("date", { ascending: true });
        if (publishedOnly) q = q.eq("status", "published");
        const { data, error } = await q; if (error) throw error; return (data || []).map(normalizeEvent);
      },
      async getEventBySlug(slug) {
        const { data, error } = await client.from("workshop_events").select("*,workshop_sessions(*)").eq("slug", slug).maybeSingle();
        if (error) throw error; return data ? normalizeEvent(data) : null;
      },
      async saveEvent(event) {
        const row = { id:event.id, title:event.title, slug:event.slug, instructor:event.instructor, date:event.date, venue:event.venue, address:event.address, summary:event.summary, description:event.description, status:event.status, cover:event.cover || null, payment_note:event.paymentNote || null };
        const { data, error } = await client.from("workshop_events").upsert(row).select().single(); if (error) throw error;
        const off = await client.from("workshop_sessions").update({ active:false }).eq("event_id", data.id); if (off.error) throw off.error;
        if (event.sessions?.length) {
          const rows = event.sessions.map((s, i) => ({ id:s.id, event_id:data.id, name:s.name, start_time:s.start || null, end_time:s.end || null, minutes:Number(s.minutes || 0), price:Number(s.price || 0), capacity:Number(s.capacity || 0), level:s.level || null, payment_url:s.paymentUrl || null, consumes:s.consumes || [], active:true, sort_order:i }));
          const up = await client.from("workshop_sessions").upsert(rows); if (up.error) throw up.error;
        }
        return event;
      },
      async deleteEvent(id) { const { error } = await client.from("workshop_events").delete().eq("id", id); if (error) throw error; },
      async duplicateEvent(id) {
        const event = (await this.listEvents()).find(e => e.id === id); if (!event) throw new Error("イベントが見つかりません");
        const stamp = Date.now(), copy = structuredClone(event); copy.id = crypto.randomUUID(); copy.slug = `${event.slug}-copy-${stamp}`; copy.title = `${event.title} コピー`; copy.status = "draft";
        const ids = new Map(copy.sessions.map(s => [s.id, crypto.randomUUID()])); copy.sessions = copy.sessions.map(s => ({ ...s, id:ids.get(s.id), consumes:(s.consumes || []).map(x => ids.get(x)).filter(Boolean) }));
        return this.saveEvent(copy);
      },
      async listReservations(eventId) {
        let q = client.from("workshop_reservations").select("*").order("created_at", { ascending:false }); if (eventId) q = q.eq("event_id", eventId);
        const { data, error } = await q; if (error) throw error;
        return (data || []).map(r => ({ id:r.id, eventId:r.event_id, sessionId:r.session_id, name:r.name, email:r.email, phone:r.phone, experience:r.experience, shoes:r.shoes, shoeSize:r.shoe_size, note:r.note, amount:r.amount, paymentStatus:r.payment_status, status:r.status, checkin:r.checkin, createdAt:r.created_at }));
      },
      async reserve(payload) {
        const { data, error } = await client.rpc("create_workshop_reservation", { p_event_slug:payload.eventSlug, p_session_id:payload.sessionId, p_name:payload.name, p_email:payload.email, p_phone:payload.phone, p_experience:payload.experience || null, p_shoes:payload.shoes || null, p_shoe_size:payload.shoeSize || null, p_note:payload.note || null });
        if (error) throw error; return data;
      },
      async updateReservation(id, patch) {
        const map = { paymentStatus:"payment_status", status:"status", checkin:"checkin" }, row = {}; Object.entries(patch).forEach(([k,v]) => row[map[k] || k] = v);
        const { data, error } = await client.from("workshop_reservations").update(row).eq("id", id).select().single(); if (error) throw error; return data;
      },
      async remaining(eventId, sessionId) {
        const { data, error } = await client.rpc("workshop_remaining_seats", { p_event_id:eventId, p_session_id:sessionId }); if (error) throw error; return Number(data || 0);
      },
      async signIn(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; return data.user; },
      async signOut() { await client.auth.signOut(); },
      async currentUser() { const { data } = await client.auth.getUser(); return data.user; },
      async uploadCover(file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase(), path = `events/${crypto.randomUUID()}.${ext}`;
        const upload = await client.storage.from(CFG.storageBucket || "workshop-media").upload(path, file, { upsert:false }); if (upload.error) throw upload.error;
        return client.storage.from(CFG.storageBucket || "workshop-media").getPublicUrl(path).data.publicUrl;
      }
    };
    return live;
  }

  function normalizeEvent(e) {
    return {
      id:e.id, slug:e.slug, title:e.title, instructor:e.instructor, date:e.date, venue:e.venue, address:e.address, summary:e.summary, description:e.description, status:e.status, cover:e.cover || "", paymentNote:e.payment_note || "", createdAt:e.created_at,
      sessions:(e.workshop_sessions || []).filter(s => s.active !== false).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map(s => ({ id:s.id, name:s.name, start:s.start_time || "", end:s.end_time || "", minutes:s.minutes, price:s.price, capacity:s.capacity, level:s.level, paymentUrl:s.payment_url || "", consumes:s.consumes || [] }))
    };
  }

  window.RSStore = { async get() { return CFG.mode === "live" ? getLive() : demo; }, config:CFG };
})();
