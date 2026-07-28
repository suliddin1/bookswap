import { adminReportInput, apiError } from "@/lib/api";
import { throwAdminActionError } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const { reportId, status, reason } = adminReportInput.parse(
      await request.json(),
    );
    await assertRateLimit(request, "admin:report", {
      actorId: admin.id,
      resourceId: reportId,
      limit: 30,
      windowMs: 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.rpc("admin_resolve_report", {
      p_actor_id: admin.id,
      p_report_id: reportId,
      p_status: status,
      p_reason: reason,
    });
    throwAdminActionError(error);
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 500, request);
  }
}
