import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { ApiError } from "@/lib/api";
import { AZ_COPY } from "@/lib/i18n";
import { requireSupabaseAdmin } from "@/lib/supabase";

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimitConsumer = (input: {
  scope: string;
  keyHash: string;
  limit: number;
  windowSeconds: number;
}) => Promise<RateLimitDecision>;

type RateLimitOptions = {
  actorId?: string;
  resourceId?: string;
  limit?: number;
  windowMs?: number;
  failureMode?: "closed" | "drop";
  consumer?: RateLimitConsumer;
  env?: NodeJS.ProcessEnv;
};

export function trustedClientIp(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (env.VERCEL !== "1" && env.BOOKSWAP_TRUST_PROXY !== "1") return null;
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim() ?? "";
  return isIP(candidate) ? candidate : null;
}

export function rateLimitKeyHash(
  secret: string,
  scope: string,
  identity: string,
  resourceId = "",
) {
  return createHmac("sha256", secret)
    .update(`${scope}\0${identity}\0${resourceId}`)
    .digest("hex");
}

async function consumeWithSupabase(input: {
  scope: string;
  keyHash: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitDecision> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_scope: input.scope,
    p_key_hash: input.keyHash,
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });
  if (error) throw error;
  const row = data?.[0];
  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    !Number.isInteger(row.remaining) ||
    !Number.isInteger(row.retry_after_seconds)
  ) {
    throw new Error("Invalid rate-limit response");
  }
  return {
    allowed: row.allowed,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after_seconds,
  };
}

export async function assertRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions = {},
) {
  const env = options.env ?? process.env;
  const limit = options.limit ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const windowSeconds = Math.ceil(windowMs / 1000);
  const clientIp = options.actorId ? null : trustedClientIp(request, env);
  const identity = options.actorId
    ? `actor:${options.actorId}`
    : clientIp
      ? `ip:${clientIp}`
      : null;
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !identity ||
    !secret ||
    !/^[a-z0-9._:-]{1,80}$/.test(scope) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 1000 ||
    windowSeconds < 1 ||
    windowSeconds > 86_400
  ) {
    if (options.failureMode === "drop") return false;
    throw new ApiError(
      AZ_COPY.api.rateLimitUnavailable,
      503,
      "RATE_LIMIT_UNAVAILABLE",
    );
  }

  try {
    const decision = await (options.consumer ?? consumeWithSupabase)({
      scope,
      keyHash: rateLimitKeyHash(secret, scope, identity, options.resourceId),
      limit,
      windowSeconds,
    });
    if (!decision.allowed) {
      if (options.failureMode === "drop") return false;
      throw new ApiError(
        AZ_COPY.api.rateLimited,
        429,
        "RATE_LIMITED",
        decision.retryAfterSeconds,
      );
    }
    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.failureMode === "drop") return false;
    throw new ApiError(
      AZ_COPY.api.rateLimitUnavailable,
      503,
      "RATE_LIMIT_UNAVAILABLE",
    );
  }
}
