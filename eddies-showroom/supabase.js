// =============================================================
// Eddie's Showroom — Supabase client + data loader
// Project: tfzxorwfafzwatmsqdxz (EddiesShowroom)
// =============================================================
//
// Usage: this script publishes `window.SUPABASE` (a configured
// client) and a `window.loadShowroomData()` function.
//
// To switch the prototype from `data.js` fixtures to Supabase,
// in `index.html` replace
//     <script src="data.js"></script>
// with
//     <script type="module" src="supabase.js"></script>
//     <script>window.addEventListener("showroom-data-ready", boot);</script>
// and gate the React mount on `boot()` instead of running it inline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://tfzxorwfafzwatmsqdxz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tuv4slQxdqNaI5rzcL71VQ_PZHhrrW_";

export const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
window.SUPABASE = sb;

// i18n strings stay client-side — they're code, not data.
// Re-export the `t` block from data.js by loading it first if present,
// otherwise fall back to a minimal stub.
const fallbackT = (window.SHOWROOM_DATA && window.SHOWROOM_DATA.t) || { en: {}, es: {} };

export async function loadShowroomData() {
  const [vehiclesRes, leadsRes, settingsRes] = await Promise.all([
    sb.from("vehicles").select("*").eq("status", "live"),
    sb.from("leads").select("*").order("created_at", { ascending: false }),
    sb.from("settings").select("*").maybeSingle(),
  ]);

  if (vehiclesRes.error) console.error("vehicles:", vehiclesRes.error);
  if (leadsRes.error)    console.error("leads:",    leadsRes.error);
  if (settingsRes.error) console.error("settings:", settingsRes.error);

  window.SHOWROOM_DATA = {
    vehicles: vehiclesRes.data ?? [],
    leads:    leadsRes.data    ?? [],
    settings: settingsRes.data ?? {},
    sections: (window.SHOWROOM_DATA && window.SHOWROOM_DATA.sections) || [],
    t: fallbackT,
  };
  window.dispatchEvent(new Event("showroom-data-ready"));
  return window.SHOWROOM_DATA;
}

window.loadShowroomData = loadShowroomData;
