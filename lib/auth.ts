import { requireSupabaseAdmin } from "@/lib/supabase";

export async function requireUser(request: Request) {
  const supabase = requireSupabaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session");
  return { id: data.user.id };
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  const supabase = requireSupabaseAdmin();
  const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) throw new Error("Admin access required");
  return user;
}
