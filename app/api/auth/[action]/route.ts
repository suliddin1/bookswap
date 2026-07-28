import { ApiError, apiError } from "@/lib/api";
import { localizedAuthResponse, type AuthAction } from "@/lib/auth-response";
import { AZ_COPY } from "@/lib/i18n";
import { assertRateLimit } from "@/lib/rate-limit";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const loginCredentials = z
  .object({ email: z.string().email(), password: z.string().min(1).max(128) })
  .strict();
const newAccountCredentials = z
  .object({ email: z.string().email(), password: z.string().min(12).max(128) })
  .strict();
const emailOnly = z.object({ email: z.string().email() }).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    if (!["signup", "login", "magic-link", "reset"].includes(action))
      throw new ApiError(
        AZ_COPY.api.authActionNotFound,
        404,
        "AUTH_ACTION_NOT_FOUND",
      );
    await assertRateLimit(request, `auth:${action}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const supabase = getSupabaseClient();
    if (!supabase)
      return apiError(
        new ApiError(
          AZ_COPY.auth.configurationUnavailable,
          503,
          "AUTH_UNAVAILABLE",
        ),
        503,
        request,
      );
    const body = await request.json();
    const authAction = action as AuthAction;
    if (authAction === "signup")
      return localizedAuthResponse(
        authAction,
        await supabase.auth.signUp(newAccountCredentials.parse(body)),
      );
    if (authAction === "login")
      return localizedAuthResponse(
        authAction,
        await supabase.auth.signInWithPassword(loginCredentials.parse(body)),
      );
    if (authAction === "magic-link")
      return localizedAuthResponse(
        authAction,
        await supabase.auth.signInWithOtp(emailOnly.parse(body)),
      );
    if (authAction === "reset")
      return localizedAuthResponse(
        authAction,
        await supabase.auth.resetPasswordForEmail(emailOnly.parse(body).email),
      );
    throw new ApiError(AZ_COPY.api.authActionNotFound, 404);
  } catch (error) {
    return apiError(error, 400, request);
  }
}
