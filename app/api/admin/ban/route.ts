import { ApiError, adminBanInput, apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const { userId, banned } = adminBanInput.parse(await request.json());
    if (userId === admin.id)
      throw new ApiError(
        "You cannot suspend your own account",
        409,
        "SELF_BAN_FORBIDDEN",
      );
    const supabase = requireSupabaseAdmin();
    const { data: target } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (target?.is_admin)
      throw new ApiError(
        "Administrator accounts cannot be suspended here",
        403,
        "ADMIN_BAN_FORBIDDEN",
      );
    const { data, error } = await supabase
      .from("users")
      .update({ banned })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 403);
  }
}
