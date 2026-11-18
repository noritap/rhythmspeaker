// Workshop Manager: operator-only new-reservation notification.
// NOT ACTIVE until the secret, log table and authenticated Database Webhook are configured.
// No changes to the existing reservation RPC or browser code.
import { createClient } from "npm:@supabase/supabase-js@2";
const TO = "rhythmspeaker296@gmail.com";
const MAX_ATTEMPTS = 3;
const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing environment setting: " + name);
  return value;
};
const str = (value: unknown) => value == null || value === "" ? "未入力" : String(value);
const safeSubject = (value: unknown) => str(value).replace(/[\r\n]/g, " ").slice(0, 90);
const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? str(value) : new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).format(d);
};
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  // verify_jwt=false is required for DB Webhooks, but must NOT make this a public sender.
  const provided = req.headers.get("x-workshop-webhook-secret");
  const expected = Deno.env.get("WORKSHOP_WEBHOOK_SECRET");
  if (!expected || !provided || provided !== expected)
    return new Response("Unauthorized", { status: 401 });
  let id = "";
  try {
    const data = await req.json();
    if (data.type !== "INSERT" || data.table !== "workshop_reservations" ||
        data.schema !== "public" || typeof data.record?.id !== "string")
      return new Response("Ignored", { status: 200 });
    id = data.record.id;
    const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false }
    });
    // Claim the reservation before calling the mail provider. Unique PK prevents concurrent sends.
    const claim = await supabase.from("workshop_notification_log")
      .insert({ reservation_id: id, status: "processing", attempts: 1 });
    if (claim.error) {
      if (claim.error.code !== "23505") throw claim.error;
      // Only a failed attempt can be retried. A stale 'processing' row needs operator review.
      const existing = await supabase.from("workshop_notification_log")
        .select("status,attempts").eq("reservation_id", id).single();
      if (existing.error) throw existing.error;
      if (existing.data.status !== "failed" || existing.data.attempts >= MAX_ATTEMPTS)
        return new Response("Already claimed / review required", { status: 200 });
      const retry = await supabase.from("workshop_notification_log")
        .update({ status: "processing", attempts: existing.data.attempts + 1, last_error: null,
          updated_at: new Date().toISOString() })
        .eq("reservation_id", id).eq("status", "failed").eq("attempts", existing.data.attempts)
        .select("reservation_id");
      if (retry.error) throw retry.error;
      if (!retry.data?.length) return new Response("Already claimed", { status: 200 });
    }
    // Trust database values, never the incoming webhook's editable JSON fields.
    const { data: booking, error: bookingError } = await supabase
      .from("workshop_reservations").select("*").eq("id", id).single();
    if (bookingError) throw bookingError;
    const [eventResult, sessionResult] = await Promise.all([
      supabase.from("workshop_events").select("title,date,venue").eq("id", booking.event_id).single(),
      supabase.from("workshop_sessions").select("name,start_time,end_time").eq("id", booking.session_id).single(),
    ]);
    if (eventResult.error) throw eventResult.error;
    if (sessionResult.error) throw sessionResult.error;
    const event = eventResult.data, session = sessionResult.data;
    const lines = [
      "Rhythm Speaker｜新規ワークショップ予約",
      "",
      "■ 開催情報",
      "イベント: " + str(event.title),
      "開催日: " + str(event.date),
      "時間: " + str(session.start_time) + "〜" + str(session.end_time),
      "クラス: " + str(session.name),
      "会場: " + str(event.venue),
      "",
      "■ 予約・申込内容",
      "予約番号: " + str(booking.id),
      "受付日時（日本時間）: " + formatDate(booking.created_at),
      "氏名: " + str(booking.name),
      "メールアドレス: " + str(booking.email),
      "電話番号: " + str(booking.phone),
      "経験: " + str(booking.experience),
      "シューズ: " + str(booking.shoes),
      "シューズサイズ: " + str(booking.shoe_size),
      "備考: " + str(booking.note),
      "参加料金: " + Number(booking.amount).toLocaleString("ja-JP") + "円",
      "入金状況: " + str(booking.payment_status),
      "予約状態: " + str(booking.status),
      "受付状態: " + (booking.checkin ? "受付済" : "未受付"),
      "予約種別: " + str(booking.reservation_kind),
      "予約経路: " + str(booking.source),
      "予約経路詳細: " + str(booking.source_detail),
      "",
      "■ 次の行動",
      "予約確認後、必要に応じて支払い方法をご案内ください。",
      "管理画面: https://noritap.github.io/rhythmspeaker/workshops/admin/",
    ];
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + required("RESEND_API_KEY"),
        "Content-Type": "application/json",
        "Idempotency-Key": "rs-workshop-reservation-" + id,
      },
      body: JSON.stringify({
        from: required("WORKSHOP_NOTIFICATION_FROM"),
        to: [TO],
        subject: "【RS新規予約】" + safeSubject(event.title) + "｜" + safeSubject(booking.name),
        text: lines.join("\n"),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) throw new Error("Resend rejected email: HTTP " + response.status);
    const done = await supabase.from("workshop_notification_log").update({
      status: "sent", provider_message_id: result.id,
      sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("reservation_id", id);
    if (done.error) throw done.error;
    return new Response("Accepted by mail provider", { status: 200 });
  } catch (err) {
    // Avoid logging personal application data or API keys.
    const reason = err instanceof Error ? err.message.slice(0, 300) : "unknown";
    console.error("Workshop notification failed", { reservation_id: id, reason });
    if (id) {
      try {
        const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"));
        await supabase.from("workshop_notification_log").update({
          status: "failed", last_error: reason, updated_at: new Date().toISOString(),
        }).eq("reservation_id", id).eq("status", "processing");
      } catch { /* preserve original failure */ }
    }
    return new Response("Notification failed", { status: 500 });
  }
});
