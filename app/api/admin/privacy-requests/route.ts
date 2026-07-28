import { adminPrivacyRequestInput, apiError } from "@/lib/api";
import { throwAdminActionError } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const input = adminPrivacyRequestInput.parse(await request.json());
    await assertRateLimit(request, "admin:privacy", {
      actorId: admin.id,
      resourceId: input.requestId,
      limit: 20,
      windowMs: 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.rpc(
      "admin_resolve_privacy_request",
      {
        p_actor_id: admin.id,
        p_request_id: input.requestId,
        p_status: input.status,
        p_reason: input.reason,
      },
    );
    throwAdminActionError(error);
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 500, request);
  }
}
