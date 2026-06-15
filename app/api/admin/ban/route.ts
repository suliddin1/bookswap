import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { userId, banned = true } = await request.json();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.from("users").update({ banned }).eq("id", userId).select().single();
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 403);
  }
}
