import { ApiError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function requireUser(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token)
    throw new ApiError("Davam etmək üçün daxil ol.", 401, "AUTH_REQUIRED");
  const supabase = getSupabaseAdmin();
  if (!supabase)
    throw new ApiError(
      "Autentifikasiya xidməti hazırda əlçatan deyil.",
      503,
      "AUTH_UNAVAILABLE",
    );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user)
    throw new ApiError(
      "Sessiyanın müddəti bitib. Yenidən daxil ol.",
      401,
      "INVALID_SESSION",
    );
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,banned,is_admin")
    .eq("id", data.user.id)
    .single();
  if (profileError || !profile)
    throw new ApiError(
      "Hesab profili əlçatan deyil.",
      403,
      "PROFILE_UNAVAILABLE",
    );
  if (profile.banned)
    throw new ApiError("Bu hesab dayandırılıb.", 403, "ACCOUNT_SUSPENDED");
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: Boolean(profile.is_admin),
  };
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.isAdmin)
    throw new ApiError(
      "Bu əməliyyat üçün idarəçi icazəsi tələb olunur.",
      403,
      "ADMIN_REQUIRED",
    );
  return user;
}
