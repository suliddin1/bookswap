import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import robots from "@/app/robots";
import { isPrivateBeta } from "@/lib/private-beta";
import { getSiteUrl } from "@/lib/site-url";
import { localizedAuthResponse } from "@/lib/auth-response";
import { requireUser } from "@/lib/auth";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalPrivateBeta = process.env.BOOKSWAP_PRIVATE_BETA;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  if (originalPrivateBeta === undefined)
    delete process.env.BOOKSWAP_PRIVATE_BETA;
  else process.env.BOOKSWAP_PRIVATE_BETA = originalPrivateBeta;
});

describe("site URL and response security", () => {
  it("uses a safe local origin when the public URL is absent", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("normalizes a configured HTTPS URL to its origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://books.example/private?q=1#x";
    expect(getSiteUrl().toString()).toBe("https://books.example/");
  });

  it("rejects non-HTTP public URL schemes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "javascript:alert(1)";
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("keeps direct access but blocks crawler indexing in private beta", () => {
    process.env.BOOKSWAP_PRIVATE_BETA = "true";
    expect(isPrivateBeta()).toBe(true);
    expect(robots()).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("does not activate private beta for ambiguous values", () => {
    process.env.BOOKSWAP_PRIVATE_BETA = "1";
    expect(isPrivateBeta()).toBe(false);
  });

  it("keeps global hardening and private API cache controls enabled", () => {
    const config = readFileSync(
      new URL("../next.config.js", import.meta.url),
      "utf8",
    );
    expect(config).toContain('key: "Content-Security-Policy"');
    expect(config).toContain('key: "Strict-Transport-Security"');
    expect(config).toContain('value: "private, no-store, max-age=0"');
    expect(config).toContain("\"frame-ancestors 'none'\"");
    expect(config).toContain("\"object-src 'none'\"");
  });

  it("keeps exact development project identifiers out of tracked guards", () => {
    const sources = [
      readFileSync(
        new URL("../scripts/validate-development-env.mjs", import.meta.url),
        "utf8",
      ),
      readFileSync(
        new URL("./authorization.integration.test.ts", import.meta.url),
        "utf8",
      ),
    ].join("\n");
    expect(sources).not.toMatch(/https:\/\/[a-z]{20}\.supabase\.co/);
    expect(sources).not.toMatch(/projectRef\s*:/);
    expect(sources).toContain("expectedDevelopmentTarget");
  });

  it("does not reveal whether a signup email already exists", async () => {
    const response = localizedAuthResponse("signup", {
      data: { internal: "must-not-escape" },
      error: {
        code: "user_already_exists",
        status: 422,
        message: "raw provider detail",
      },
    });
    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      data: null,
      error: null,
      accepted: true,
    });
  });

  it("returns a real generic error status without provider details", async () => {
    const response = localizedAuthResponse("login", {
      data: { internal: "must-not-escape" },
      error: {
        code: "invalid_credentials",
        status: 401,
        message: "database/provider detail",
      },
    });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({
      data: null,
      error: { code: "AUTH_FAILED" },
    });
    expect(JSON.stringify(body)).not.toContain("database/provider detail");
    expect(JSON.stringify(body)).not.toContain("must-not-escape");
  });

  it("rejects missing bearer identity before requiring server credentials", async () => {
    await expect(
      requireUser(new Request("https://example.test/api/review")),
    ).rejects.toMatchObject({ status: 401, code: "AUTH_REQUIRED" });
  });
});
