import { randomUUID } from "node:crypto";

type LogLevel = "error" | "info" | "warn";
type SafeLogFields = Record<
  string,
  boolean | number | string | null | undefined
>;

const SAFE_ID = /^[a-zA-Z0-9._:-]{1,100}$/;

export function requestId(request?: Request) {
  const supplied = request?.headers.get("x-request-id")?.trim();
  return supplied && SAFE_ID.test(supplied) ? supplied : randomUUID();
}

export function safeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = String(error.code);
  return SAFE_ID.test(code) ? code : null;
}

export function logServerEvent(
  level: LogLevel,
  event: string,
  fields: SafeLogFields = {},
) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    ),
  });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export function logServerError(
  event: string,
  error: unknown,
  fields: SafeLogFields = {},
) {
  logServerEvent("error", event, {
    ...fields,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: safeErrorCode(error),
  });
}
