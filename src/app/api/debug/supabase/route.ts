import { NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseError, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const configured = isSupabaseConfigured();
  const client = getSupabaseClient();
  const error = getSupabaseError();

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    isConfigured: configured,
    clientInitialized: !!client,
    initError: error,
    environment: envCheck,
    status: configured && client ? "OK" : "FAILED",
  });
}
