(function () {
  "use strict";
  // Public read-only promotion. Never reads reservations, member data or payment records.
  const SLUG = /^[a-z0-9][a-z0-9-]{1,99}$/;
  function tokyoDate(now) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now);
    const field = name => parts.find(part => part.type === name)?.value || "";
    return field("year") + "-" + field("month") + "-" + field("day");
  }
  function activeSessions(event, now, today) {
    if (!Array.isArray(event.workshop_sessions)) return [];
    return event.workshop_sessions.filter(session => {
      if (!session || session.active !== true) return false;
      if (event.date !== today) return true;
      const start = String(session.start_time || "").slice(0, 5);
      if (!/^\d{2}:\d{2}$/.test(start)) return false;
      const time = Date.parse(event.date + "T" + start + ":00+09:00");
      return Number.isFinite(time) && time > now.getTime();
    });
  }
  function selectUpcoming(events, now) {
    if (!Array.isArray(events)) return [];
    const today = tokyoDate(now);
    const month = today.slice(0, 7);
    return events.filter(event => {
      if (!event || event.status !== "published" || !SLUG.test(event.slug || "")) return false;
      if (typeof event.title !== "string" || !event.title.trim()) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date || "")) return false;
      if (event.date < today || event.date.slice(0, 7) !== month) return false;
      if (event.registration_close_at) {
        const deadline = Date.parse(event.registration_close_at);
        if (!Number.isFinite(deadline) || deadline <= now.getTime()) return false;
      }
      return activeSessions(event, now, today).length > 0;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "ja")).slice(0, 2);
  }
  function minPrice(event, now) {
    const eligible = activeSessions(event, now, tokyoDate(now));
    const prices = eligible.map(s => s.price).filter(p => Number.isInteger(p) && p > 0);
    return prices.length ? Math.min(...prices) : null;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function card(event, now) {
    const article = element("article", "ws-reco-card");
    const date = element("time", "ws-reco-date",
      new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
        .format(new Date(event.date + "T12:00:00+09:00")));
    date.dateTime = event.date;
    article.append(date, element("p", "ws-reco-tag", "特別ワークショップ"));
    article.appendChild(element("h3", "ws-reco-name", event.title));
    if (event.instructor) article.appendChild(element("p", "ws-reco-teacher", "講師：" + event.instructor));
    const bottom = element("div", "ws-reco-card-bottom");
    const price = minPrice(event, now);
    bottom.appendChild(element("span", "ws-reco-price", price === null ?
      "料金は詳細で確認" : new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(price) + "〜"));
    const anchor = element("a", "ws-reco-link", "内容・予約状況を見る →");
    anchor.href = new URL("../workshops/event.html?slug=" + encodeURIComponent(event.slug), document.baseURI).href;
    anchor.setAttribute("aria-label", event.title + " の内容と予約状況を見る");
    anchor.dataset.recommendationType = "workshop";
    bottom.appendChild(anchor);
    article.appendChild(bottom);
    article.prepend(date);
    return article;
  }
  async function getPublishedEvents(config, now, fetcher) {
    if (!config || config.mode !== "live" || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || "") ||
        !String(config.supabasePublishableKey || "").startsWith("sb_publishable_")) {
      throw new Error("Unapproved public workshop source");
    }
    const today = tokyoDate(now);
    const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7));
    const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    const url = new URL(config.supabaseUrl + "/rest/v1/workshop_events");
    url.searchParams.set("select", "slug,title,instructor,date,status,registration_close_at,workshop_sessions(name,price,active,start_time)");
    url.searchParams.set("status", "eq.published");
    url.searchParams.append("date", "gte." + today);
    url.searchParams.append("date", "lt." + nextMonth);
    url.searchParams.set("order", "date.asc");
    url.searchParams.set("limit", "20");
    const timeout = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(8000) : undefined;
    const response = await fetcher(url.href, {
      method: "GET",
      headers: { apikey: config.supabasePublishableKey, Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal: timeout
    });
    if (!response.ok) throw new Error("Workshop public data unavailable");
    const body = await response.json();
    if (!Array.isArray(body)) throw new Error("Invalid public workshop response");
    return body;
  }
  async function mount() {
    const section = document.getElementById("rs-workshop-recommendations");
    const output = document.getElementById("rs-ws-cards");
    if (!section || !output) return;
    section.hidden = true;
    try {
      const now = new Date();
      const rows = await getPublishedEvents(window.RS_WORKSHOP_CONFIG, now, window.fetch.bind(window));
      const events = selectUpcoming(rows, new Date());
      if (!events.length) return;
      output.replaceChildren(...events.map(item => card(item, new Date())));
      section.hidden = false;
    } catch (_) {
      // Optional recommendation must never block a lesson reservation.
      section.hidden = true;
    }
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tokyoDate, selectUpcoming, minPrice, getPublishedEvents };
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
    else mount();
  }
})();