import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getSiteUrl } from "@/lib/site-url";
import { localizedAuthResponse } from "@/lib/auth-response";
import { requireUser } from "@/lib/auth";
import {
  getLegalIdentity,
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_FULL_NAME,
  LEGAL_VERSION,
} from "@/lib/legal";
import { isPrivateBeta } from "@/lib/private-beta";
import { legalSignupInput } from "@/lib/legal-consent";
import robots from "@/app/robots";

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

  it("uses the approved centralized legal identity and version", () => {
    expect(LEGAL_VERSION).toBe("2026-08-07");
    expect(LEGAL_OPERATOR_FULL_NAME).toBe("Suliddin Musa Əsədzadə");
    expect(LEGAL_CONTACT_EMAIL).toBe("Suliddin677@gmail.com");
    expect(getLegalIdentity()).toMatchObject({
      operatorFullName: "Suliddin Musa Əsədzadə",
      contactEmail: "Suliddin677@gmail.com",
      complete: true,
    });
  });

  it.each(["", "   ", "[EMAIL]", "{{LEGAL_CONTACT_EMAIL}}"])(
    "fails closed for an unconfigured public legal contact: %j",
    (contactEmail) => {
      expect(() =>
        getLegalIdentity({
          BOOKSWAP_PRIVATE_BETA: "false",
          LEGAL_OPERATOR_FULL_NAME: LEGAL_OPERATOR_FULL_NAME,
          LEGAL_CONTACT_EMAIL: contactEmail,
        }),
      ).toThrow(/Public launch requires/);
      expect(
        getLegalIdentity({
          BOOKSWAP_PRIVATE_BETA: "true",
          LEGAL_OPERATOR_FULL_NAME: LEGAL_OPERATOR_FULL_NAME,
          LEGAL_CONTACT_EMAIL: contactEmail,
        }),
      ).toMatchObject({ complete: false, privateBeta: true });
    },
  );

  it("still fails closed for a missing public operator identity", () => {
    expect(() =>
      getLegalIdentity({
        BOOKSWAP_PRIVATE_BETA: "false",
        LEGAL_OPERATOR_FULL_NAME: "",
        LEGAL_CONTACT_EMAIL: LEGAL_CONTACT_EMAIL,
      }),
    ).toThrow(/Public launch requires/);
    expect(isPrivateBeta({ BOOKSWAP_PRIVATE_BETA: "1" })).toBe(false);
  });

  it("keeps private beta directly reachable but excluded from crawlers", () => {
    process.env.BOOKSWAP_PRIVATE_BETA = "true";
    expect(robots()).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    const layout = readFileSync(
      new URL("../app/layout.tsx", import.meta.url),
      "utf8",
    );
    expect(layout).toContain("index: false");
    expect(layout).toContain("follow: false");
    expect(layout).toContain("AZ_COPY.privateBeta.notice");
  });

  it("requires every current legal affirmation at the signup boundary", () => {
    const accepted = {
      name: "Sınaq Oxucusu",
      email: "reader@example.invalid",
      password: "BookSwapPass123",
      termsVersion: LEGAL_VERSION,
      privacyVersion: LEGAL_VERSION,
      marketplaceRulesVersion: LEGAL_VERSION,
      age18PlusConfirmed: true,
      personalDataProcessingConsent: true,
      crossBorderTransferDisclosedAndConsented: true,
    } as const;
    expect(legalSignupInput.parse(accepted)).toEqual(accepted);
    expect(() =>
      legalSignupInput.parse({
        ...accepted,
        personalDataProcessingConsent: false,
      }),
    ).toThrow();
    expect(() =>
      legalSignupInput.parse({
        ...accepted,
        marketplaceRulesVersion: "old-version",
      }),
    ).toThrow();
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
