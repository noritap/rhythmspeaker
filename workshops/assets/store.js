(() => {
  const CFG = window.RS_WORKSHOP_CONFIG || { mode: "demo" };
  const KEYS = { events: "rswm_events_v1", reservations: "rswm_reservations_v1", admin: "rswm_admin_v1" };
  const NAOYUKI_SLUG = "naoyuki-2026-10-16";
  const NAOYUKI_COVER = "./assets/naoyuki-workshop-flyer-v2.jpg?v=20260828-2";
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

  const read = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function normalizeNaoyukiEvent(event) {
    if (!(event.id === NAOYUKI_SLUG || event.slug === NAOYUKI_SLUG)) return event;
    return {
      ...event,
      title: event.title || seedEvent.title,
      instructor: event.instructor || seedEvent.instructor,
      date: event.date || seedEvent.date,
      venue: event.venue || seedEvent.venue,
      address: event.address || seedEvent.address,
      summary: event.summary || seedEvent.summary,
      description: event.description || seedEvent.description,
      status: event.status || seedEvent.status,
      cover: NAOYUKI_COVER,
      paymentNote: event.paymentNote || seedEvent.paymentNote,
      sessions: Array.isArray(event.sessions) && event.sessions.length ? event.sessions : seedEvent.sessions
    };
  }

  function ensureSeed() {
    const events = read(KEYS.events, []);
    if (!events.length) { write(KEYS.events, [seedEvent]); return; }
    let found = false;
    const next = events.map(event => {
      if (event.id === NAOYUKI_SLUG || event.slug === NAOYUKI_SLUG) {
        found = true;
        return normalizeNaoyukiEvent(event);
      }
      return event;
    });
    if (!found) next.unshift(seedEvent);
    write(KEYS.events, next);
  }
  ensureSeed();

  const demo = {
    mode: "demo",
    async listEvents({ publishedOnly = false } = {}) {
      const rows = read(KEYS.events, []).map(normalizeNaoyukiEvent);
      return publishedOnly ? rows.filter(e => e.status === "published") : rows;
    },
    async getEventBySlug(slug) {
      const found = read(KEYS.events, []).find(e => e.slug === slug || e.id === slug) || null;
      return found ? normalizeNaoyukiEvent(found) : null;
    },
    async saveEvent(event) {
      const rows = read(KEYS.events, []);
      const payload = normalizeNaoyukiEvent(event);
      const i = rows.findIndex(e => e.id === payload.id);
      if (i >= 0) rows[i] = payload; else rows.unshift(payload);
      write(KEYS.events, rows);
      return payload;
    },
    async deleteEvent(id) { write(KEYS.events, read(KEYS.events, []).filter(e => e.id !== id)); },
    async duplicateEvent(id) {
      const src = read(KEYS.events, []).find(e => e.id === id);
      if (!src) throw new Error("イベントが見つかりません");
      const stamp = Date.now(), copy = structuredClone(src);
      copy.id = `${src.slug}-copy-${stamp}`;
      copy.slug = copy.id;
      copy.title = `${src.title} コピー`;
      copy.status = "draft";
      copy.createdAt = new Date().toISOString();
      copy.sessions = copy.sessions.map((s, i) => ({ ...s, id: `s${stamp}-${i}` }));
      const rows = read(KEYS.events, []); rows.unshift(copy); write(KEYS.events, rows); return copy;
    },
    async listReservations(eventId) { return read(KEYS.reservations, []).filter(r => !eventId || r.eventId === eventId); },
    async reserve(payload) {
      const event = await this.getEventBySlug(payload.eventSlug);
      if (!event) throw new Error("イベントが見つかりません");
      const session = event.sessions.find(s => s.id === payload.sessionId);
      if (!session) throw new Error("クラスが見つかりません");
      if (await this.remaining(event.id, session.id) <= 0) throw new Error("満席です");
      const r = { ...payload, id: `RS-${Date.now().toString(36).toUpperCase()}`, eventId: event.id, amount: session.price, paymentStatus: "unpaid", status: "reserved", checkin: false, createdAt: new Date().toISOString() };
      const rows = read(KEYS.reservations, []); rows.push(r); write(KEYS.reservations, rows); return r;
    },
    async updateReservation(id, patch) {
      const rows = read(KEYS.reservations, []), i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error("予約が見つかりません");
      rows[i] = { ...rows[i], ...patch }; write(KEYS.reservations, rows); return rows[i];
    },
    async remaining(eventId, sessionId) {
      const event = read(KEYS.events, []).map(normalizeNaoyukiEvent).find(e => e.id === eventId);
      if (!event) return 0;
      const session = event.sessions.find(s => s.id === sessionId);
      if (!session) return 0;
      const active = read(KEYS.reservations, []).filter(r => r.eventId === eventId && r.status !== "cancelled");
      const consumes = session.consumes || [session.id];
      const relevant = active.filter(r => {
        const rs = event.sessions.find(s => s.id === r.sessionId), rc = rs?.consumes || [r.sessionId];
        return rc.some(x => consumes.includes(x));
      });
      return Math.max(0, session.capacity - relevant.length);
    },
    async signIn(email, password) { if (!email || !password) throw new Error("メールとパスワードを入力してください"); write(KEYS.admin, { email, at: Date.now() }); return { email }; },
    async signOut() { localStorage.removeItem(KEYS.admin); },
    async currentUser() { return read(KEYS.admin, null); },
    async uploadCover(file) {
      return new Promise((resolve, reject) => {
        const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = reject; fr.readAsDataURL(file);
      });
    }
  };

  let live = null;
  async function getLive() {
    if (live) return live;
    if (!window.supabase || !CFG.supabaseUrl || !CFG.supabasePublishableKey) throw new Error("Supabase設定がありません");
    const client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey);
    live = {
      mode: "live",
      async listEvents({ publishedOnly = false } = {}) { let q = client.from("workshop_events").select("*,workshop_sessions(*)").order("date", { ascending: true }); if (publishedOnly) q = q.eq("status", "published"); const { data, error } = await q; if (error) throw error; return (data || []).map(normalizeEvent); },
      async getEventBySlug(slug) { const { data, error } = await client.from("workshop_events").select("*,workshop_sessions(*)").eq("slug", slug).maybeSingle(); if (error) throw error; return data ? normalizeEvent(data) : null; },
      async saveEvent(event) {
        const row = { id: event.id, title: event.title, slug: event.slug, instructor: event.instructor, date: event.date, venue: event.venue, address: event.address, summary: event.summary, description: event.description, status: event.status, cover: event.cover || null, payment_note: event.paymentNote || null };
        const { data, error } = await client.from("workshop_events").upsert(row).select().single(); if (error) throw error;
        await client.from("workshop_sessions").update({ active: false }).eq("event_id", data.id);
        if (event.sessions?.length) {
          const sessions = event.sessions.map((s, i) => ({ id: s.id, event_id: data.id, name: s.name, start_time: s.start || null, end_time: s.end || null, minutes: Number(s.minutes || 0), price: Number(s.price || 0), capacity: Number(s.capacity || 0), level: s.level || null, payment_url: s.paymentUrl || null, consumes: s.consumes || [], active: true, sort_order: i }));
          const ins = await client.from("workshop_sessions").upsert(sessions); if (ins.error) throw ins.error;
        }
        return event;
      },
      async deleteEvent(id) { const { error } = await client.from("workshop_events").delete().eq("id", id); if (error) throw error; },
      async duplicateEvent(id) {
        const e = (await this.listEvents()).find(x => x.id === id); if (!e) throw new Error("イベントが見つかりません");
        const stamp = Date.now(), copy = structuredClone(e); copy.id = crypto.randomUUID(); copy.slug = `${e.slug}-copy-${stamp}`; copy.title = `${e.title} コピー`; copy.status = "draft";
        const idMap = new Map(copy.sessions.map(s => [s.id, crypto.randomUUID()])); copy.sessions = copy.sessions.map(s => ({ ...s, id: idMap.get(s.id), consumes: (s.consumes || []).map(x => idMap.get(x)).filter(Boolean) })); return this.saveEvent(copy);
      },
      async listReservations(eventId) {
        let q = client.from("workshop_reservations").select("*").order("created_at", { ascending: false }); if (eventId) q = q.eq("event_id", eventId);
        const { data, error } = await q; if (error) throw error;
        return (data || []).map(r => ({ id: r.id, eventId: r.event_id, sessionId: r.session_id, name: r.name, email: r.email, phone: r.phone, experience: r.experience, shoes: r.shoes, shoeSize: r.shoe_size, note: r.note, amount: r.amount, paymentStatus: r.payment_status, status: r.status, checkin: r.checkin, createdAt: r.created_at }));
      },
      async reserve(payload) { const { data, error } = await client.rpc("create_workshop_reservation", { p_event_slug: payload.eventSlug, p_session_id: payload.sessionId, p_name: payload.name, p_email: payload.email, p_phone: payload.phone, p_experience: payload.experience || null, p_shoes: payload.shoes || null, p_shoe_size: payload.shoeSize || null, p_note: payload.note || null }); if (error) throw error; return data; },
      async updateReservation(id, patch) { const map = { paymentStatus: "payment_status", status: "status", checkin: "checkin" }, row = {}; Object.entries(patch).forEach(([k, v]) => row[map[k] || k] = v); const { data, error } = await client.from("workshop_reservations").update(row).eq("id", id).select().single(); if (error) throw error; return data; },
      async remaining(eventId, sessionId) { const { data, error } = await client.rpc("workshop_remaining_seats", { p_event_id: eventId, p_session_id: sessionId }); if (error) throw error; return Number(data || 0); },
      async signIn(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; return data.user; },
      async signOut() { await client.auth.signOut(); },
      async currentUser() { const { data } = await client.auth.getUser(); return data.user; },
      async uploadCover(file) { const ext = (file.name.split(".").pop() || "jpg").toLowerCase(), path = `events/${crypto.randomUUID()}.${ext}`; const up = await client.storage.from(CFG.storageBucket || "workshop-media").upload(path, file, { upsert: false }); if (up.error) throw up.error; const { data } = client.storage.from(CFG.storageBucket || "workshop-media").getPublicUrl(path); return data.publicUrl; }
    };
    return live;
  }

  function normalizeEvent(e) {
    return { id: e.id, slug: e.slug, title: e.title, instructor: e.instructor, date: e.date, venue: e.venue, address: e.address, summary: e.summary, description: e.description, status: e.status, cover: e.cover || "", paymentNote: e.payment_note || "", createdAt: e.created_at, sessions: (e.workshop_sessions || []).filter(s => s.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(s => ({ id: s.id, name: s.name, start: s.start_time || "", end: s.end_time || "", minutes: s.minutes, price: s.price, capacity: s.capacity, level: s.level, paymentUrl: s.payment_url || "", consumes: s.consumes || [] })) };
  }
  window.RSStore = { async get() { return CFG.mode === "live" ? getLive() : demo; }, config: CFG };
})();
