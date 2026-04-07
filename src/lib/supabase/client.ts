import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient(): SupabaseClient | null {
  if (!isConfigured) return null;
  
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return supabaseInstance;
}

export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : ({} as SupabaseClient);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}
