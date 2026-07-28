import { describe, expect, it, vi } from "vitest";
import { ApiError, apiError } from "@/lib/api";
import {
  assertRateLimit,
  rateLimitKeyHash,
  trustedClientIp,
} from "@/lib/rate-limit";

const request = (headers: HeadersInit = {}) =>
  new Request("https://example.test/api/action", { headers });
const env = (values: Record<string, string> = {}): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  ...values,
});

describe("durable rate limiting", () => {
  it("ignores forwarding headers outside a trusted platform boundary", () => {
    expect(
      trustedClientIp(request({ "x-forwarded-for": "203.0.113.10" }), env()),
    ).toBeNull();
  });

  it("accepts only a valid first IP from the trusted Vercel header", () => {
    const trustedEnv = env({ VERCEL: "1" });
    expect(
      trustedClientIp(
        request({
          "x-vercel-forwarded-for": "203.0.113.10, 198.51.100.4",
        }),
        trustedEnv,
      ),
    ).toBe("203.0.113.10");
    expect(
      trustedClientIp(
        request({ "x-vercel-forwarded-for": "not-an-ip" }),
        trustedEnv,
      ),
    ).toBeNull();
  });

  it("hashes identities without retaining the raw actor or resource", () => {
    const first = rateLimitKeyHash(
      "development-secret",
      "chat.message",
      "actor:user-id",
      "room-id",
    );
    const second = rateLimitKeyHash(
      "development-secret",
      "chat.message",
      "actor:user-id",
      "room-id",
    );

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toContain("user-id");
    expect(first).not.toContain("room-id");
  });

  it("passes bounded counters to the durable consumer", async () => {
    const consumer = vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 60,
    });

    await expect(
      assertRateLimit(request(), "listing.create", {
        actorId: "11111111-1111-1111-1111-111111111111",
        resourceId: "marketplace",
        limit: 5,
        windowMs: 60_000,
        consumer,
        env: env({
          SUPABASE_SERVICE_ROLE_KEY: "development-secret",
        }),
      }),
    ).resolves.toBe(true);

    expect(consumer).toHaveBeenCalledWith({
      scope: "listing.create",
      keyHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      limit: 5,
      windowSeconds: 60,
    });
  });

  it("returns a stable 429 with retry information", async () => {
    const limited = assertRateLimit(request(), "chat.message", {
      actorId: "11111111-1111-1111-1111-111111111111",
      consumer: async () => ({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 42,
      }),
      env: env({
        SUPABASE_SERVICE_ROLE_KEY: "development-secret",
      }),
    });

    await expect(limited).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      retryAfterSeconds: 42,
    });

    const response = apiError(
      new ApiError("ignored", 429, "RATE_LIMITED", 42),
      400,
      request(),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("fails closed for protected actions and drops optional telemetry", async () => {
    await expect(
      assertRateLimit(request(), "listing.create", {
        actorId: "11111111-1111-1111-1111-111111111111",
        env: env(),
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "RATE_LIMIT_UNAVAILABLE",
    });

    await expect(
      assertRateLimit(request(), "web-vitals", {
        failureMode: "drop",
        env: env(),
      }),
    ).resolves.toBe(false);
  });

  it("converts durable-store failures into a safe unavailable response", async () => {
    await expect(
      assertRateLimit(request(), "review.create", {
        actorId: "11111111-1111-1111-1111-111111111111",
        consumer: async () => {
          throw new Error("database details must not escape");
        },
        env: env({
          SUPABASE_SERVICE_ROLE_KEY: "development-secret",
        }),
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "RATE_LIMIT_UNAVAILABLE",
    });
  });
});
