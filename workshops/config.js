window.RS_WORKSHOP_CONFIG = {
  mode: "live",
  supabaseUrl: "https://mfsiddjdillkeaowabsh.supabase.co",
  supabasePublishableKey: "sb_publishable_v1hLsky-r-WmhQiu3t-Z_Q_G3XhCobb",
  storageBucket: "workshop-media"
};

if (document.getElementById("reserveForm")) {
  const seatDisplayScript = document.createElement("script");
  seatDisplayScript.src = "./assets/public-seat-display.js?v=20260829-1";
  document.head.appendChild(seatDisplayScript);
}
