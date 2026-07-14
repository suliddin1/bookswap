import { ApiError, adminBanInput, apiError } from "@/lib/api";
import { throwAdminActionError } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const { userId, banned, reason } = adminBanInput.parse(
      await request.json(),
    );
    if (userId === admin.id)
      throw new ApiError(
        "You cannot suspend your own account",
        409,
        "SELF_BAN_FORBIDDEN",
      );
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.rpc("admin_set_user_ban", {
      p_actor_id: admin.id,
      p_target_id: userId,
      p_banned: banned,
      p_reason: reason,
    });
    throwAdminActionError(error);
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 500);
  }
}
