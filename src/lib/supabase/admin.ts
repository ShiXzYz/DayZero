import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;
let initError: string | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  if (initError) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    initError = "NEXT_PUBLIC_SUPABASE_URL not configured";
    console.error("[Supabase]", initError);
    return null;
  }

  if (!serviceKey) {
    initError = "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not configured";
    console.error("[Supabase]", initError);
    return null;
  }

  try {
    supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[Supabase] Client initialized successfully");
    return supabaseAdmin;
  } catch (error) {
    initError = `Failed to initialize Supabase: ${error instanceof Error ? error.message : String(error)}`;
    console.error("[Supabase]", initError);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseError(): string | null {
  return initError;
}
