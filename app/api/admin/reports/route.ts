import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const { reportId, status } = await request.json();
    if (!["resolved", "dismissed"].includes(status)) throw new Error("Invalid report status.");
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.from("reports").update({ status }).eq("id", reportId).select().single();
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 403);
  }
}
