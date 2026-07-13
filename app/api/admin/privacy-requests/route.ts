import { adminPrivacyRequestInput, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const input = adminPrivacyRequestInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("privacy_requests")
      .update({
        status: input.status,
        resolved_at:
          input.status === "completed" || input.status === "rejected"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", input.requestId)
      .select("id,status,resolved_at")
      .single();
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 403);
  }
}
