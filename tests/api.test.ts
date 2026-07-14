import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  favoriteInput,
  adminBanInput,
  adminModerationInput,
  adminPrivacyRequestInput,
  adminReportInput,
  listingImageCleanupInput,
  listingInput,
  listingUpdateInput,
  privacyRequestInput,
  profileInput,
  reportInput,
  reviewInput,
  roomInput,
  messageInput,
} from "../lib/api";
import { assertOwnedListingImages, escapeHtml } from "../lib/security";
import { isFavoriteListingVisible } from "../lib/favorites";
import {
  getOwnedListingImagePath,
  partitionListingImageCleanupJobs,
} from "../lib/listing-images";
import {
  createListingCursorScope,
  decodeListingCursor,
  encodeListingCursor,
  getListingCursorFilter,
  parseListingLimit,
  parseListingSort,
} from "../lib/listing-pagination";
import {
  assertModerationApproved,
  moderateAndRecordText,
  moderateImage,
  moderateText,
  planListingUpdateModeration,
} from "../lib/moderation";
import { throwAdminActionError } from "../lib/admin-actions";
import {
  APP_LOCALE,
  AZ_COPY,
  DOCUMENT_LANGUAGE,
  formatAzn,
  formatAzDate,
  formatCategory,
  formatCity,
  formatCondition,
  formatLoadedBooks,
  formatListingStatus,
  formatPrivacyRequestStatus,
  formatPrivacyRequestType,
  formatReviewSummary,
  formatStars,
  localizeApiError,
  localizeAuthError,
} from "../lib/i18n";

const originalOpenAIKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAIKey;
  vi.unstubAllGlobals();
});

describe("marketplace input validation", () => {
  it("uses one Azerbaijani locale contract for public marketplace labels", () => {
    expect(DOCUMENT_LANGUAGE).toBe("az");
    expect(APP_LOCALE).toBe("az-AZ");
    expect(formatAzn(17.5)).toBe("17,5\u00a0₼");
    expect(formatAzn(1234.5)).toBe("1 234,5\u00a0₼");
    expect(
      formatAzDate("2026-07-14T00:00:00.000Z", {
        month: "long",
        year: "numeric",
      }),
    ).toBe("iyul 2026");
    expect(AZ_COPY.metadata.title).toContain("ikinci həyat");
    expect(formatAzn(12)).toBe("12\u00a0₼");
    expect(formatAzDate("2026-07-14T00:00:00.000Z")).toBe("14 iyl 2026");
    expect(formatCategory("Fiction")).toBe("Bədii ədəbiyyat");
    expect(formatCondition("Very good")).toBe("Çox yaxşı");
    expect(formatCity("Nakhchivan")).toBe("Naxçıvan");
    expect(formatListingStatus("sold")).toBe("Satılıb");
    expect(formatPrivacyRequestType("deletion")).toContain("silinməsi");
    expect(formatPrivacyRequestStatus("in_progress")).toBe("İcradadır");
    expect(formatPrivacyRequestType("custom")).toBe("custom");
    expect(formatReviewSummary(4.5, 2)).toBe("2 rəyə əsasən 4,5");
    expect(formatLoadedBooks(7)).toBe("7 kitab yüklənib");
    expect(formatStars(5)).toBe("5 ulduz");
    expect(localizeApiError("REPORT_EXISTS", "fallback")).toContain(
      "açıq şikayətin",
    );
    expect(localizeApiError("UNKNOWN", "fallback")).toBe("fallback");
    expect(localizeAuthError({ code: "invalid_credentials" })).toBe(
      AZ_COPY.auth.invalidCredentials,
    );
    expect(localizeAuthError({ message: "provider detail" })).toBe(
      AZ_COPY.auth.failed,
    );
    expect(formatCategory("User supplied value")).toBe("User supplied value");
  });

  it("keeps localized public marketplace surfaces free of their old English copy", () => {
    const sources = [
      "../app/layout.tsx",
      "../app/manifest.ts",
      "../app/loading.tsx",
      "../app/error.tsx",
      "../app/not-found.tsx",
      "../app/page.tsx",
      "../components/site-header.tsx",
      "../components/site-footer.tsx",
      "../components/catalog.tsx",
      "../components/book-card.tsx",
      "../app/listings/[id]/page.tsx",
      "../app/sellers/[id]/page.tsx",
      "../app/favorites/page.tsx",
      "../components/listing-detail.tsx",
      "../components/seller-profile.tsx",
      "../components/favorites-page.tsx",
      "../app/listings/new/page.tsx",
      "../app/listings/[id]/edit/page.tsx",
      "../app/login/page.tsx",
      "../app/reset-password/page.tsx",
      "../components/listing-wizard.tsx",
      "../components/edit-listing-form.tsx",
      "../components/auth-panel.tsx",
      "../components/reset-password-panel.tsx",
      "../app/profile/page.tsx",
      "../app/user-rights/page.tsx",
      "../components/profile-dashboard.tsx",
      "../components/privacy-request-form.tsx",
      "../app/api/profile/route.ts",
      "../app/api/privacy-requests/route.ts",
      "../lib/client-listing-images.ts",
      "../lib/client-api.ts",
    ]
      .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
      .join("\n");

    for (const oldCopy of [
      "Give yours a second life",
      "Finding the right shelf",
      "Something went wrong",
      "That page left the shelf",
      "Books for sale",
      "Catalog search card",
      "Save listing",
      "Browse available books",
      "This book is unavailable",
      "Back to the shelves",
      "Available from a reader",
      "Reader reviews",
      "Safe exchange",
      "Report this listing",
      "Reader bookstore",
      "Public inventory",
      "Saved catalog",
      "Sign in to see favorites",
      "List a book",
      "Book details",
      "Choose book photos",
      "Publish listing",
      "Manage listing",
      "Edit book details",
      "Reader login",
      "Sign in to your shelf",
      "Create account",
      "Forgot password",
      "Choose a new password",
      "Authentication failed",
      "Supabase is not configured",
      "Seller dashboard",
      "Welcome back",
      "My Listings",
      "Saved by readers",
      "Listing views",
      "Delete this listing permanently",
      "Request type",
      "Access my data",
      "Submit secure request",
      "Your recent requests",
      "User Rights",
      "Account & data",
      "Dashboard → Profile",
      "Profile saved",
    ]) {
      expect(sources).not.toContain(oldCopy);
    }
  });

  it("keeps profile and privacy aggregates narrow and fail-closed", () => {
    const profileRoute = readFileSync(
      new URL("../app/api/profile/route.ts", import.meta.url),
      "utf8",
    );
    const privacyRoute = readFileSync(
      new URL("../app/api/privacy-requests/route.ts", import.meta.url),
      "utf8",
    );

    expect(profileRoute.match(/\.select\("name,phone,city"\)/g)).toHaveLength(
      2,
    );
    expect(profileRoute).toContain(
      "if (listingsResult.error) throw listingsResult.error",
    );
    expect(profileRoute).toContain(
      "if (favoritesResult.error) throw favoritesResult.error",
    );
    expect(profileRoute.match(/apiError\(error, 500\)/g)).toHaveLength(2);
    expect(privacyRoute.match(/apiError\(error, 500\)/g)).toHaveLength(2);
    expect(
      privacyRequestInput.parse({
        type: "appeal",
        details: "Qərarın yenidən nəzərdən keçirilməsini xahiş edirəm.",
      }).type,
    ).toBe("appeal");
  });

  it("accepts a complete listing", () => {
    const listing = listingInput.parse({
      title: "A good book",
      author: "A Reader",
      description: "A clean copy ready for its next reader.",
      price: 12,
      category: "Fiction",
      city: "Baku",
      condition: "Very good",
      images: [
        "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg",
      ],
    });
    expect(listing.images).toHaveLength(1);
  });

  it("limits chat message length", () => {
    expect(() =>
      messageInput.parse({ roomId: "room-1", text: "x".repeat(2001) }),
    ).toThrow();
  });

  it("only accepts five-star review scale", () => {
    expect(() =>
      reviewInput.parse({ listingId: "one", rating: 6, comment: "Nice book" }),
    ).toThrow();
  });

  it("requires UUID identifiers for protected resources", () => {
    expect(() => favoriteInput.parse({ listingId: "not-an-id" })).toThrow();
    expect(() => roomInput.parse({ listingId: "not-an-id" })).toThrow();
  });

  it("only lets sellers choose supported public statuses", () => {
    expect(listingUpdateInput.parse({ status: "sold" }).status).toBe("sold");
    expect(() => listingUpdateInput.parse({ status: "locked" })).toThrow();
  });

  it("validates report and privacy request detail lengths", () => {
    expect(() =>
      reportInput.parse({
        listingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        reason: "short",
      }),
    ).toThrow();
    expect(() =>
      privacyRequestInput.parse({ type: "deletion", details: "short" }),
    ).toThrow();
  });

  it("requires a bounded reason for every administrator action", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(() => adminBanInput.parse({ userId: id, banned: true })).toThrow();
    expect(() =>
      adminModerationInput.parse({
        listingId: id,
        action: "reject",
        reason: "too short",
      }),
    ).toThrow();
    expect(
      adminReportInput.parse({
        reportId: id,
        status: "resolved",
        reason: "Verified report evidence.",
      }).reason,
    ).toBe("Verified report evidence.");
    expect(
      adminPrivacyRequestInput.parse({
        requestId: id,
        status: "completed",
        reason: "Identity and request scope verified.",
      }).reason,
    ).toBe("Identity and request scope verified.");
  });

  it("fully moderates the final copy whenever a listing becomes public", () => {
    const currentImages = ["https://example.com/one.png"];
    const finalImages = [
      "https://example.com/one.png",
      "https://example.com/two.png",
    ];
    expect(
      planListingUpdateModeration({
        currentStatus: "draft",
        requestedStatus: "active",
        textChanged: false,
        currentImages,
        requestedImages: finalImages,
      }),
    ).toEqual({ moderateText: true, imageUrls: finalImages });
    expect(
      planListingUpdateModeration({
        currentStatus: "sold",
        requestedStatus: "active",
        textChanged: false,
        currentImages,
      }),
    ).toEqual({ moderateText: true, imageUrls: currentImages });
  });

  it("moderates only changed content while an active listing stays public", () => {
    expect(
      planListingUpdateModeration({
        currentStatus: "active",
        requestedStatus: "active",
        textChanged: false,
        currentImages: ["https://example.com/one.png"],
        requestedImages: [
          "https://example.com/one.png",
          "https://example.com/two.png",
        ],
      }),
    ).toEqual({
      moderateText: false,
      imageUrls: ["https://example.com/two.png"],
    });
  });

  it("maps transactional admin conflicts without exposing database errors", () => {
    for (const [databaseCode, status, code] of [
      ["P0002", 404, "TARGET_NOT_FOUND"],
      ["42501", 403, "ADMIN_ACTION_FORBIDDEN"],
      ["23514", 409, "ADMIN_ACTION_CONFLICT"],
      ["22023", 422, "INVALID_ADMIN_ACTION"],
    ] as const) {
      let captured: unknown;
      try {
        throwAdminActionError({
          code: databaseCode,
          message: "private detail",
        });
      } catch (error) {
        captured = error;
      }
      expect(captured).toMatchObject({ status, code });
      expect(String((captured as Error).message)).not.toContain(
        "private detail",
      );
    }
  });

  it("rejects role fields in profile updates", () => {
    expect(() =>
      profileInput.parse({ name: "Reader", city: "Baku", is_admin: true }),
    ).toThrow();
  });

  it("escapes user content before email rendering", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("only accepts listing images from the owner's storage folder", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(() =>
      assertOwnedListingImages(
        [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg",
        ],
        "user-1",
      ),
    ).not.toThrow();
    expect(() =>
      assertOwnedListingImages(["https://tracker.example/cover.jpg"], "user-1"),
    ).toThrow();
    expect(() =>
      assertOwnedListingImages(
        [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-2/cover.jpg",
        ],
        "user-1",
      ),
    ).toThrow();
    expect(
      getOwnedListingImagePath(
        "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg",
        "user-1",
      ),
    ).toBe("user-1/cover.jpg");
    expect(() =>
      assertOwnedListingImages(
        [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg?download=1",
        ],
        "user-1",
      ),
    ).toThrow();
    expect(() =>
      assertOwnedListingImages(
        [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/%2e%2e%2fuser-2%2fcover.jpg",
        ],
        "user-1",
      ),
    ).toThrow();
    expect(() =>
      assertOwnedListingImages(
        [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/nested/cover.jpg",
        ],
        "user-1",
      ),
    ).toThrow();
    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });

  it("bounds abandoned upload cleanup requests", () => {
    expect(
      listingImageCleanupInput.parse({
        images: [
          "https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg",
        ],
      }).images,
    ).toHaveLength(1);
    expect(() => listingImageCleanupInput.parse({ images: [] })).toThrow();
    expect(() =>
      listingImageCleanupInput.parse({
        images: [
          "https://project.supabase.co/image.jpg",
          "https://project.supabase.co/image.jpg",
        ],
      }),
    ).toThrow();
    expect(() =>
      listingImageCleanupInput.parse({
        images: Array.from(
          { length: 6 },
          (_, index) => `https://project.supabase.co/image-${index}.jpg`,
        ),
      }),
    ).toThrow();
  });

  it("never removes a cleanup job while another listing references its image", () => {
    const shared = { id: 1, image_url: "https://project/shared.jpg" };
    const obsolete = { id: 2, image_url: "https://project/obsolete.jpg" };
    const result = partitionListingImageCleanupJobs(
      [shared, obsolete],
      [{ images: [shared.image_url] }],
    );

    expect(result.referencedJobs).toEqual([shared]);
    expect(result.removableJobs).toEqual([obsolete]);
  });

  it("round-trips deterministic listing cursors and binds them to scope", () => {
    const scope = createListingCursorScope({
      type: "catalog",
      query: "kitab",
      city: "Baku",
    });
    expect(scope).toBe(
      createListingCursorScope({
        city: "Baku",
        query: "kitab",
        type: "catalog",
      }),
    );
    const encoded = encodeListingCursor(
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        created_at: "2026-07-14T05:00:00.000Z",
        price: 12,
      },
      "newest",
      scope,
    );
    const decoded = decodeListingCursor(encoded, "newest", scope);
    expect(decoded).toEqual({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      createdAt: "2026-07-14T05:00:00.000Z",
      sort: "newest",
      scope,
    });
    expect(getListingCursorFilter(decoded!)).toContain(
      "and(created_at.eq.2026-07-14T05:00:00.000Z,id.lt.aaaaaaaa",
    );
    expect(() =>
      decodeListingCursor(
        encoded,
        "newest",
        createListingCursorScope({ type: "seller" }),
      ),
    ).toThrow();
    expect(() => decodeListingCursor(`${encoded}x`, "newest", scope)).toThrow();
  });

  it("uses deterministic price cursor directions", () => {
    const scope = createListingCursorScope({ type: "catalog", sort: "price" });
    const row = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      created_at: "2026-07-14T05:00:00.000Z",
      price: 17.5,
    };
    const low = decodeListingCursor(
      encodeListingCursor(row, "price-low", scope),
      "price-low",
      scope,
    );
    const high = decodeListingCursor(
      encodeListingCursor(row, "price-high", scope),
      "price-high",
      scope,
    );
    expect(getListingCursorFilter(low!)).toBe(
      `price.gt.17.5,and(price.eq.17.5,id.gt.${row.id})`,
    );
    expect(getListingCursorFilter(high!)).toBe(
      `price.lt.17.5,and(price.eq.17.5,id.lt.${row.id})`,
    );
  });

  it("validates public listing sort and page limits", () => {
    expect(parseListingSort(null)).toBe("newest");
    expect(parseListingSort("price-low")).toBe("price-low");
    expect(() => parseListingSort("popular")).toThrow();
    expect(parseListingLimit(null)).toBe(24);
    expect(parseListingLimit("99")).toBe(50);
    expect(() => parseListingLimit("2.5")).toThrow();
  });

  it("only exposes favorites for public states and active sellers", () => {
    expect(
      isFavoriteListingVisible({ status: "active", seller: { banned: false } }),
    ).toBe(true);
    expect(
      isFavoriteListingVisible({ status: "sold", seller: { banned: false } }),
    ).toBe(true);
    expect(
      isFavoriteListingVisible({ status: "draft", seller: { banned: false } }),
    ).toBe(false);
    expect(
      isFavoriteListingVisible({ status: "locked", seller: { banned: false } }),
    ).toBe(false);
    expect(
      isFavoriteListingVisible({ status: "active", seller: { banned: true } }),
    ).toBe(false);
    expect(isFavoriteListingVisible({ status: "active" })).toBe(false);
  });

  it("reports an unconfigured moderation provider as unavailable", async () => {
    delete process.env.OPENAI_API_KEY;
    const decision = await moderateText("Normal marketplace description");
    expect(decision).toMatchObject({
      outcome: "unavailable",
      provider: "none",
      reasonCode: "PROVIDER_NOT_CONFIGURED",
    });
    expect(JSON.stringify(decision)).not.toContain("Demo");
    expect(() => assertModerationApproved(decision)).toThrow(
      "Məzmun yoxlama xidməti",
    );
  });

  it("rejects a local unsafe fixture even without a provider", async () => {
    delete process.env.OPENAI_API_KEY;
    const decision = await moderateText("This is a scam payment request");
    expect(decision).toMatchObject({
      outcome: "rejected",
      provider: "local_rules",
      reasonCode: "LOCAL_MARKETPLACE_RULE",
    });
    expect(() => assertModerationApproved(decision)).toThrow(
      "təhlükəsizlik qaydalarına",
    );
  });

  it("parses provider decisions and sends image moderation as multimodal input", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "modr-test",
          results: [
            {
              flagged: false,
              categories: { harassment: false, violence: false },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const decision = await moderateImage("https://example.com/book.jpg");
    expect(decision).toMatchObject({
      outcome: "approved",
      provider: "openai",
      reasonCode: "PROVIDER_APPROVED",
      providerDecisionId: "modr-test",
    });
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body)).input).toEqual([
      {
        type: "image_url",
        image_url: { url: "https://example.com/book.jpg" },
      },
    ]);
  });

  it("fails closed on malformed provider responses", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ results: [] }), { status: 200 }),
        ),
    );
    expect(await moderateText("Normal marketplace description")).toMatchObject({
      outcome: "unavailable",
      reasonCode: "PROVIDER_RESPONSE_INVALID",
    });
  });

  it("maps provider transport failures to explicit unavailable reasons", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const scenarios: Array<[unknown, string]> = [
      [new Response(null, { status: 429 }), "PROVIDER_RATE_LIMITED"],
      [new Response(null, { status: 500 }), "PROVIDER_REQUEST_FAILED"],
      [new Error("offline"), "PROVIDER_UNREACHABLE"],
      [
        Object.assign(new Error("timed out"), { name: "TimeoutError" }),
        "PROVIDER_TIMEOUT",
      ],
    ];
    for (const [result, reasonCode] of scenarios) {
      vi.stubGlobal(
        "fetch",
        result instanceof Response
          ? vi.fn().mockResolvedValue(result)
          : vi.fn().mockRejectedValue(result),
      );
      expect(
        await moderateText("Normal marketplace description"),
      ).toMatchObject({ outcome: "unavailable", reasonCode });
    }
  });

  it("records decision metadata without storing submitted content", async () => {
    delete process.env.OPENAI_API_KEY;
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert })) };
    await moderateAndRecordText(
      supabase as never,
      "Private text that must not enter the ledger",
      {
        actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        surface: "moderation_api",
      },
    );
    expect(supabase.from).toHaveBeenCalledWith("moderation_decisions");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "unavailable",
        reason_code: "PROVIDER_NOT_CONFIGURED",
      }),
    );
    expect(JSON.stringify(insert.mock.calls[0][0])).not.toContain(
      "Private text",
    );
  });

  it("fails closed when the moderation ledger cannot be written", async () => {
    delete process.env.OPENAI_API_KEY;
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: { message: "denied" } }),
      })),
    };
    await expect(
      moderateAndRecordText(supabase as never, "Normal text", {
        actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        surface: "moderation_api",
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "MODERATION_AUDIT_UNAVAILABLE",
    });
  });

  it("uses only RLS-protected Postgres Changes for chat delivery", () => {
    const messageRoute = readFileSync(
      new URL("../app/api/chat/message/route.ts", import.meta.url),
      "utf8",
    );
    const chatHook = readFileSync(
      new URL("../hooks/use-chat.ts", import.meta.url),
      "utf8",
    );
    const chatPanel = readFileSync(
      new URL("../components/chat-panel.tsx", import.meta.url),
      "utf8",
    );
    const unreadHook = readFileSync(
      new URL("../hooks/use-chat-unread.ts", import.meta.url),
      "utf8",
    );
    const notificationsHook = readFileSync(
      new URL("../hooks/use-notifications.ts", import.meta.url),
      "utf8",
    );
    const notificationMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714063000_add_chat_read_state_and_durable_notifications.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const moderationRoute = readFileSync(
      new URL("../app/api/admin/moderate/route.ts", import.meta.url),
      "utf8",
    );
    const adminBanRoute = readFileSync(
      new URL("../app/api/admin/ban/route.ts", import.meta.url),
      "utf8",
    );
    const adminReportsRoute = readFileSync(
      new URL("../app/api/admin/reports/route.ts", import.meta.url),
      "utf8",
    );
    const adminPrivacyRoute = readFileSync(
      new URL("../app/api/admin/privacy-requests/route.ts", import.meta.url),
      "utf8",
    );
    const adminDashboardRoute = readFileSync(
      new URL("../app/api/admin/dashboard/route.ts", import.meta.url),
      "utf8",
    );
    const adminPanel = readFileSync(
      new URL("../components/admin-panel.tsx", import.meta.url),
      "utf8",
    );
    const adminAuditMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714073000_add_transactional_admin_audit.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const automatedModerationRoute = readFileSync(
      new URL("../app/api/moderate/route.ts", import.meta.url),
      "utf8",
    );
    const moderationLibrary = readFileSync(
      new URL("../lib/moderation.ts", import.meta.url),
      "utf8",
    );
    const moderationMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714070000_add_reviewable_moderation_decisions.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const listingUpdateRoute = readFileSync(
      new URL("../app/api/listings/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const protectedListingMutationMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714080000_require_protected_listing_mutations.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(messageRoute).not.toContain("broadcast");
    expect(messageRoute).not.toContain(".channel(");
    expect(messageRoute).not.toContain("notifyUser");
    expect(messageRoute).toContain("notificationDelivered: true");
    expect(chatHook).not.toContain("broadcast");
    expect(chatHook).toContain('"postgres_changes"');
    expect(chatPanel).toContain('"postgres_changes"');
    expect(chatPanel).toContain('method: "PATCH"');
    expect(unreadHook).toContain('table: "chat_room_reads"');
    expect(unreadHook).toContain('event: "UPDATE"');
    expect(notificationsHook).toContain('event: "UPDATE"');
    expect(notificationMigration).toContain(
      "create table if not exists public.chat_room_reads",
    );
    expect(notificationMigration).toContain(
      "create trigger deliver_chat_message",
    );
    expect(notificationMigration).toContain("insert into public.notifications");
    expect(notificationMigration).toContain(
      "alter publication supabase_realtime add table public.chat_room_reads",
    );
    expect(moderationRoute).toContain('.rpc("admin_moderate_listing"');
    expect(moderationRoute).toContain("sendOptionalNotificationEmail");
    expect(moderationRoute).not.toContain('.from("listings")');
    expect(adminBanRoute).toContain("admin_set_user_ban");
    expect(adminReportsRoute).toContain("admin_resolve_report");
    expect(adminPrivacyRoute).toContain("admin_resolve_privacy_request");
    expect(adminDashboardRoute).toContain('.from("admin_audit_log")');
    expect(adminDashboardRoute).toContain("listingsError");
    expect(adminDashboardRoute).toContain("auditError");
    expect(adminPanel).toContain("admin-action-reason");
    expect(adminPanel).toContain("Immutable administrator action history");
    expect(adminAuditMigration).toContain(
      "create table public.admin_audit_log",
    );
    expect(adminAuditMigration).toContain(
      "create trigger reject_admin_audit_mutation",
    );
    expect(adminAuditMigration).toContain(
      "grant select on table public.admin_audit_log to service_role",
    );
    expect(adminAuditMigration).not.toContain(
      "grant insert on table public.admin_audit_log to service_role",
    );
    for (const rpc of [
      "admin_set_user_ban",
      "admin_moderate_listing",
      "admin_resolve_report",
      "admin_resolve_privacy_request",
    ]) {
      expect(adminAuditMigration).toContain(`function public.${rpc}`);
    }
    expect(automatedModerationRoute).toContain("MODERATION_UNAVAILABLE");
    expect(moderationLibrary).not.toContain("Demo moderation passed");
    expect(moderationLibrary).not.toContain("Demo image check passed");
    expect(moderationMigration).toContain(
      "create table public.moderation_decisions",
    );
    expect(moderationMigration).toContain(
      "grant select, insert on table public.moderation_decisions to service_role",
    );
    expect(moderationMigration).toContain(
      "Raw submitted content is intentionally excluded",
    );
    expect(listingUpdateRoute).toContain("planListingUpdateModeration");
    expect(listingUpdateRoute).toContain('existing.status === "locked"');
    expect(protectedListingMutationMigration).toContain(
      "revoke insert, update, delete on table public.listings from authenticated",
    );
    expect(protectedListingMutationMigration).toContain(
      "grant select, insert, update, delete on table public.listings to service_role",
    );
  });

  it("keeps listing image cleanup owner-checked, durable, and revocable", () => {
    const uploadRoute = readFileSync(
      new URL("../app/api/upload/route.ts", import.meta.url),
      "utf8",
    );
    const listingRoute = readFileSync(
      new URL("../app/api/listings/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const wizard = readFileSync(
      new URL("../components/listing-wizard.tsx", import.meta.url),
      "utf8",
    );
    const editForm = readFileSync(
      new URL("../components/edit-listing-form.tsx", import.meta.url),
      "utf8",
    );
    const migration = readFileSync(
      new URL(
        "../supabase/migrations/20260714052000_add_listing_image_cleanup_jobs.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(uploadRoute).toContain("assertOwnedListingImages");
    expect(uploadRoute).toContain("queueListingImageCleanup");
    expect(listingRoute).toContain("drainListingImageCleanupJobs");
    expect(listingRoute).not.toContain("decodeURIComponent(");
    expect(wizard).toContain("URL.revokeObjectURL");
    expect(wizard).toContain("cleanupUploadedListingImages");
    expect(editForm).toContain("URL.revokeObjectURL");
    expect(editForm).toContain("AZ_COPY.listingForm.removeCurrentPhoto");
    expect(migration).toContain("after update of images or delete");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("from anon, authenticated");
    const ownerSelectMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714053500_allow_owner_listing_image_selection.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(ownerSelectMigration).toContain("Users select own listing images");
    expect(ownerSelectMigration).toContain("storage.foldername(name)");
    const serviceOnlyMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714054500_make_cleanup_jobs_service_only_explicit.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(serviceOnlyMigration).toContain("using (false)");
    expect(serviceOnlyMigration).toContain("with check (false)");
    const deduplicationMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714055500_deduplicate_listing_image_cleanup_jobs.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(deduplicationMigration).toContain("select distinct");
  });
});
