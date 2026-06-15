import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (typeof window === "undefined") return createClient(url, key);
  browserClient ??= createClient(url, key);
  return browserClient;
}

export function requireSupabaseClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase public client is not configured.");
  return client;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function requireSupabaseAdmin() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase is not configured. Add the required variables to .env.local.");
  return client;
}
