import { getSupabaseClient } from "@/lib/supabase";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Please sign in to continue.");
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
}
