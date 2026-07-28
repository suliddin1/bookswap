import { localizeAuthError } from "@/lib/i18n";

export type AuthAction = "signup" | "login" | "magic-link" | "reset";

const ACCEPTED_HEADERS = { "Cache-Control": "private, no-store" } as const;
const enumerationSensitiveCodes = new Set([
  "email_exists",
  "user_already_exists",
  "user_not_found",
]);

export function localizedAuthResponse(
  action: AuthAction,
  result: { data: unknown; error: unknown },
) {
  if (!result.error) {
    if (action === "login")
      return Response.json(result, { headers: ACCEPTED_HEADERS });
    return Response.json(
      { data: null, error: null, accepted: true },
      { status: 202, headers: ACCEPTED_HEADERS },
    );
  }
  const source =
    typeof result.error === "object" && result.error !== null
      ? (result.error as Record<string, unknown>)
      : {};
  if (
    action !== "login" &&
    typeof source.code === "string" &&
    enumerationSensitiveCodes.has(source.code)
  ) {
    return Response.json(
      { data: null, error: null, accepted: true },
      { status: 202, headers: ACCEPTED_HEADERS },
    );
  }
  const status =
    typeof source.status === "number" &&
    source.status >= 400 &&
    source.status < 500
      ? source.status
      : 503;
  return Response.json(
    {
      data: null,
      error: {
        message: localizeAuthError(result.error),
        code: "AUTH_FAILED",
      },
    },
    { status, headers: ACCEPTED_HEADERS },
  );
}
