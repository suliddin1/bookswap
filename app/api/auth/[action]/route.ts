import { ApiError, apiError, assertRateLimit } from "@/lib/api";
import { AZ_COPY, localizeAuthError } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const credentials = z
  .object({ email: z.string().email(), password: z.string().min(8).max(128) })
  .strict();
const emailOnly = z.object({ email: z.string().email() }).strict();

function localizedAuthResponse(result: { data: unknown; error: unknown }) {
  if (!result.error) return Response.json(result);
  const source =
    typeof result.error === "object" && result.error !== null
      ? (result.error as Record<string, unknown>)
      : {};
  return Response.json({
    data: result.data,
    error: {
      message: localizeAuthError(result.error),
      ...(typeof source.code === "string" ? { code: source.code } : {}),
      ...(typeof source.status === "number" ? { status: source.status } : {}),
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertRateLimit(request, "auth", 10, 60_000);
    const { action } = await params;
    const supabase = getSupabaseClient();
    if (!supabase)
      return apiError(new Error(AZ_COPY.auth.configurationUnavailable), 503);
    const body = await request.json();
    if (action === "signup")
      return localizedAuthResponse(
        await supabase.auth.signUp(credentials.parse(body)),
      );
    if (action === "login")
      return localizedAuthResponse(
        await supabase.auth.signInWithPassword(credentials.parse(body)),
      );
    if (action === "magic-link")
      return localizedAuthResponse(
        await supabase.auth.signInWithOtp(emailOnly.parse(body)),
      );
    if (action === "reset")
      return localizedAuthResponse(
        await supabase.auth.resetPasswordForEmail(emailOnly.parse(body).email),
      );
    throw new ApiError(
      AZ_COPY.api.authActionNotFound,
      404,
      "AUTH_ACTION_NOT_FOUND",
    );
  } catch (error) {
    return apiError(error);
  }
}
