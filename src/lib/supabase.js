import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '%c Smart Kirana %c Running in Local-First Mode (LocalStorage Engine active). To connect live Supabase cloud, configure VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in your .env file.',
    'background: #059669; color: #fff; border-radius: 4px; padding: 2px 6px; font-weight: bold;',
    'color: #047857;'
  );
}
