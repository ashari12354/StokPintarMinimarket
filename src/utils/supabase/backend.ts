import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifndyxpdcvjihdrirrhj.supabase.co",
  publishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_tP4eT2jBMN9rf6RVSgu27w_Pab3mJvi",
  secretKey: process.env.SUPABASE_SECRET_KEY,
  jwksUrl:
    process.env.SUPABASE_JWKS_URL ||
    "https://ifndyxpdcvjihdrirrhj.supabase.co/auth/v1/.well-known/jwks.json",
};

/**
 * Creates a backend Supabase client for API routes / Server handlers.
 * Uses SUPABASE_SECRET_KEY when configured (and not a placeholder), otherwise uses SUPABASE_PUBLISHABLE_KEY.
 * Never expose SUPABASE_SECRET_KEY to browser code.
 */
export function createBackendSupabaseClient() {
  const hasRealSecretKey =
    SUPABASE_CONFIG.secretKey &&
    !SUPABASE_CONFIG.secretKey.includes("••••") &&
    !SUPABASE_CONFIG.secretKey.includes("GANTI_DENGAN");

  const apiKey = hasRealSecretKey ? SUPABASE_CONFIG.secretKey! : SUPABASE_CONFIG.publishableKey;

  return createSupabaseClient(SUPABASE_CONFIG.url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
