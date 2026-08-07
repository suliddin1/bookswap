import { ApiError, apiError } from "@/lib/api";
import { localizedAuthResponse, type AuthAction } from "@/lib/auth-response";
import { AZ_COPY } from "@/lib/i18n";
import { legalSignupInput } from "@/lib/legal-consent";
import { assertRateLimit } from "@/lib/rate-limit";
import { getSupabasePublicServerClient } from "@/lib/supabase";
import { z } from "zod";

const loginCredentials = z
  .object({ email: z.string().email(), password: z.string().min(1).max(128) })
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
    const supabase = getSupabasePublicServerClient();
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
    if (authAction === "signup") {
      const input = legalSignupInput.parse(body);
      return localizedAuthResponse(
        authAction,
        await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              name: input.name,
              terms_version: input.termsVersion,
              privacy_version: input.privacyVersion,
              marketplace_rules_version: input.marketplaceRulesVersion,
              age_18_plus_confirmed: input.age18PlusConfirmed,
              personal_data_processing_consent:
                input.personalDataProcessingConsent,
              cross_border_transfer_disclosed_and_consented:
                input.crossBorderTransferDisclosedAndConsented,
            },
          },
        }),
      );
    }
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
