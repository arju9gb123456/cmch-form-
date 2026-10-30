// ============================================================
//  CONFIG — yahan apni Supabase details daalo
// ============================================================
//  Dono khali rahe toh app "Local demo mode" me chalega:
//  data sirf usi browser me save hoga (dusre device ka data admin ko NAHI dikhega).
//
//  Supabase connect karne ke liye (README.md me step-by-step hai):
//   1. supabase.com par project banao
//   2. SQL Editor me supabase/schema.sql run karo
//   3. Project Settings → API se URL aur "anon public" key yahan paste karo
//  Anon key public rakhna safe hai — data RLS policies se protected hai.
// ============================================================
window.APP_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Sirf local demo mode ke liye admin password (Supabase mode me Supabase login use hota hai)
  LOCAL_ADMIN_PASSWORD: "admin123",

  ORG_NAME: "Chirayu Medical College & Hospital, Bhopal"
};
