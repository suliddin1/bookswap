import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("notifications")
      .select("id,type,payload,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return Response.json({ data: data ?? [] });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) throw error;
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error, 500);
  }
}
