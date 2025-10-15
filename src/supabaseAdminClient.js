// src/supabaseAdminClient.js
import { createClient } from '@supabase/supabase-js';
const URL = process.env.REACT_APP_SUPABASE_URL;
const ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;
const k = '__sb_admin_singleton__';
const client = window[k] || createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'eos-admin-auth' },
});
if (!window[k]) window[k] = client;
export default client;




// // src/supabaseAdminClient.js
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
//     auth: {
//         persistSession: true,
//         autoRefreshToken: true,
//         storageKey: 'eos-admin-auth', // ← SADECE admin oturumu (farklı!)
//     },
// });

// if (process.env.NODE_ENV === 'development') {
//     window.supabaseAdmin = supabaseAdmin;
// }

// export default supabaseAdmin;
