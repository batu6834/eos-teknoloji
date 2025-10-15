// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
const URL = process.env.REACT_APP_SUPABASE_URL;
const ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;
const k = '__sb_site_singleton__';
export const supabase = window[k] || createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'eos-site-auth' },
});
if (!window[k]) window[k] = supabase;




// // SITE (firma & genel web) Supabase client
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//     console.error('Supabase env değişkenleri eksik. .env dosyanı kontrol et.');
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//     auth: {
//         persistSession: true,
//         autoRefreshToken: true,
//         storageKey: 'eos-site-auth', // ← site/firma için ayrı anahtar
//     },
// });

// // Sadece development'ta konsoldan erişim
// if (process.env.NODE_ENV === 'development') {
//     window.siteSupabase = supabase;
// }
