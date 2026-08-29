window.RS_WORKSHOP_CONFIG = {
  mode: "live",
  supabaseUrl: "https://mfsiddjdillkeaowabsh.supabase.co",
  supabasePublishableKey: "sb_publishable_v1hLsky-r-WmhQiu3t-Z_Q_G3XhCobb",
  storageBucket: "workshop-media",
  publicSeatThreshold: 3
};

if (document.getElementById("reserveForm")) {
  const seatDisplayScript = document.createElement("script");
  seatDisplayScript.src = "./assets/public-seat-display.js?v=20260830-3";
  document.head.appendChild(seatDisplayScript);
}
