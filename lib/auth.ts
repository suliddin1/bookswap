import { ApiError } from "@/lib/api";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function requireUser(request: Request) {
  const supabase = requireSupabaseAdmin();
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token)
    throw new ApiError("Authentication required", 401, "AUTH_REQUIRED");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user)
    throw new ApiError("Invalid or expired session", 401, "INVALID_SESSION");
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,banned,is_admin")
    .eq("id", data.user.id)
    .single();
  if (profileError || !profile)
    throw new ApiError(
      "Account profile is unavailable",
      403,
      "PROFILE_UNAVAILABLE",
    );
  if (profile.banned)
    throw new ApiError(
      "This account has been suspended",
      403,
      "ACCOUNT_SUSPENDED",
    );
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: Boolean(profile.is_admin),
  };
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.isAdmin)
    throw new ApiError("Admin access required", 403, "ADMIN_REQUIRED");
  return user;
}
