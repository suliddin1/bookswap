import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("@/lib/rate-limit", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/rate-limit")>(
      "@/lib/rate-limit",
    );
  return { ...actual, assertRateLimit: vi.fn().mockResolvedValue(true) };
});
import {
  ApiError,
  apiError,
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
import { formatNotificationEmail } from "../lib/notify";
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
  parseListingLimit,
  parseListingSort,
} from "../lib/listing-pagination";
import {
  assertModerationApproved,
  moderateAndRecordText,
  moderateText,
  planListingUpdateModeration,
} from "../lib/moderation";
import { throwAdminActionError } from "../lib/admin-actions";
import { parseAdminDashboardResponse } from "../lib/admin-dashboard";
import {
  APP_LOCALE,
  AZ_COPY,
  DOCUMENT_LANGUAGE,
  formatAdminAuditAction,
  formatAdminAuditState,
  formatAdminAuditTarget,
  formatAzn,
  formatAzDate,
  formatAzDateTime,
  formatAzTime,
  formatCategory,
  formatCity,
  formatCondition,
  formatLoadedBooks,
  formatListingStatus,
  formatModerationCategory,
  formatModerationContentType,
  formatModerationOutcome,
  formatModerationProvider,
  formatModerationReason,
  formatModerationSurface,
  formatNotificationPresentation,
  formatPrivacyRequestStatus,
  formatPrivacyRequestType,
  formatReviewSummary,
  formatStars,
  localizeApiError,
  localizeAuthError,
} from "../lib/i18n";
import {
  parseChatMessage,
  parseChatRoomDetail,
  parseChatRoomSummaries,
} from "../lib/chat-client";
import {
  classifyMarketplaceVitalRoute,
  createWebVitalPayload,
  rateWebVital,
} from "../lib/web-vitals";
import {
  parseListingDetailResponse,
  parseListingPageResponse,
  parseSellerResponse,
} from "../lib/marketplace-responses";
import {
  parseFavoriteListingsResponse,
  parseListingDeletionResponse,
  parseListingMutationResponse,
  parsePrivacyRequestListResponse,
  parsePrivacyRequestSubmissionResponse,
  parseProfileDashboardResponse,
  parseProfileSaveResponse,
} from "../lib/account-responses";
import {
  getResponseErrorCode,
  parseListingCleanupResponse,
  parseListingDataResponse,
  parseListingUpdateResponse,
  parseListingUploadResponse,
  readResponseJson,
} from "../lib/listing-authoring-responses";
import {
  parseFavoriteLookupResponse,
  parseFavoriteMutationResponse,
  parseReportCreationResponse,
  parseReviewCreationResponse,
  parseRoomCreationResponse,
} from "../lib/listing-detail-action-responses";
import { POST as reportWebVital } from "../app/api/vitals/route";

const originalWebVitalsEnabled = process.env.WEB_VITALS_ENABLED;

afterEach(() => {
  if (originalWebVitalsEnabled === undefined)
    delete process.env.WEB_VITALS_ENABLED;
  else process.env.WEB_VITALS_ENABLED = originalWebVitalsEnabled;
  vi.unstubAllGlobals();
});

describe("marketplace input validation", () => {
  it("rejects malformed public marketplace success responses", () => {
    const listing = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Sınaq kitabı",
      author: "Sınaq müəllifi",
      description: "Etibarlı cavab sınağı",
      price: 12.5,
      images: ["/icon.svg"],
      category: "Fiction",
      condition: "Very good",
      city: "Baku",
      status: "active",
      sellerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      seller: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Sınaq satıcısı",
      },
    };
    const page = {
      data: { items: [listing], nextCursor: "opaque-cursor" },
    };
    const detail = {
      data: {
        ...listing,
        reviews: [
          {
            id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            rating: 5,
            comment: "Əla kitabdır.",
            created_at: "2026-07-24T10:00:00.000Z",
            author: { name: "Oxucu" },
          },
        ],
      },
    };
    const seller = {
      data: {
        seller: {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          name: "Sınaq satıcısı",
          city: "Baku",
          createdAt: "2026-07-24T10:00:00.000Z",
          initials: "SS",
          rating: 5,
          reviewCount: 1,
        },
        items: [listing],
        nextCursor: null,
      },
    };

    expect(parseListingPageResponse(page)).toEqual(page.data);
    expect(parseListingDetailResponse(detail, listing.id)).toEqual(detail.data);
    expect(parseSellerResponse(seller)).toEqual(seller.data);

    expect(
      parseListingPageResponse({ data: { items: {}, nextCursor: null } }),
    ).toBeNull();
    expect(
      parseListingDetailResponse({
        data: {
          ...detail.data,
          reviews: [{ ...detail.data.reviews[0], rating: 9 }],
        },
      }),
    ).toBeNull();
    expect(
      parseListingDetailResponse(
        detail,
        "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      ),
    ).toBeNull();
    expect(
      parseListingDetailResponse({
        data: {
          ...detail.data,
          sellerId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        },
      }),
    ).toBeNull();
    expect(
      parseSellerResponse({
        data: {
          ...seller.data,
          seller: { ...seller.data.seller, createdAt: "not-a-date" },
        },
      }),
    ).toBeNull();
  });

  it("binds listing-detail action responses to the requested resource and user", () => {
    const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const otherListingId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const buyerId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const sellerId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const otherUserId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const roomId = "11111111-1111-4111-8111-111111111111";
    const reportId = "22222222-2222-4222-8222-222222222222";
    const reviewId = "33333333-3333-4333-8333-333333333333";
    const createdAt = "2026-07-26T10:00:00.000Z";

    expect(
      parseFavoriteLookupResponse(
        { data: { listingId, saved: false } },
        listingId,
      ),
    ).toEqual({ saved: false });
    expect(
      parseFavoriteLookupResponse(
        { data: { listingId, saved: "false" } },
        listingId,
      ),
    ).toBeNull();
    expect(
      parseFavoriteLookupResponse(
        { data: { listingId: otherListingId, saved: false } },
        listingId,
      ),
    ).toBeNull();

    expect(
      parseFavoriteMutationResponse(
        { data: { listingId, saved: true } },
        listingId,
        true,
      ),
    ).toEqual({ saved: true });
    expect(
      parseFavoriteMutationResponse({ saved: true }, listingId, true),
    ).toBeNull();
    expect(
      parseFavoriteMutationResponse(
        { data: { listingId, saved: false } },
        listingId,
        true,
      ),
    ).toBeNull();
    expect(
      parseFavoriteMutationResponse(
        { data: { listingId: otherListingId, saved: true } },
        listingId,
        true,
      ),
    ).toBeNull();

    const room = {
      data: {
        id: roomId,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
      },
    };
    const expectedRoom = { listingId, buyerId, sellerId };
    expect(parseRoomCreationResponse(room, expectedRoom)).toEqual({
      id: roomId,
    });
    expect(
      parseRoomCreationResponse(
        { data: { ...room.data, id: "not-a-room" } },
        expectedRoom,
      ),
    ).toBeNull();
    for (const mismatch of [
      { listing_id: otherListingId },
      { buyer_id: otherUserId },
      { seller_id: otherUserId },
    ]) {
      expect(
        parseRoomCreationResponse(
          { data: { ...room.data, ...mismatch } },
          expectedRoom,
        ),
      ).toBeNull();
    }

    const report = {
      data: {
        id: reportId,
        listing_id: listingId,
        reporter_id: buyerId,
        status: "open",
        created_at: createdAt,
      },
    };
    const expectedReport = { listingId, reporterId: buyerId };
    expect(parseReportCreationResponse(report, expectedReport)).toEqual({
      id: reportId,
    });
    for (const mismatch of [
      { listing_id: otherListingId },
      { reporter_id: otherUserId },
      { status: "resolved" },
      { created_at: "not-a-date" },
    ]) {
      expect(
        parseReportCreationResponse(
          { data: { ...report.data, ...mismatch } },
          expectedReport,
        ),
      ).toBeNull();
    }

    const expectedReview = {
      listingId,
      authorId: buyerId,
      rating: 4,
      comment: "Etibarlı rəy",
    };
    const review = {
      data: {
        id: reviewId,
        listing_id: listingId,
        author_id: buyerId,
        rating: 4,
        comment: "Etibarlı rəy",
        created_at: createdAt,
      },
    };
    expect(parseReviewCreationResponse(review, expectedReview)).toEqual({
      id: reviewId,
      rating: 4,
      comment: "Etibarlı rəy",
      created_at: createdAt,
    });
    for (const mismatch of [
      { id: "not-a-review" },
      { listing_id: otherListingId },
      { author_id: otherUserId },
      { rating: 5 },
      { comment: "Başqa rəy" },
      { created_at: "not-a-date" },
    ]) {
      expect(
        parseReviewCreationResponse(
          { data: { ...review.data, ...mismatch } },
          expectedReview,
        ),
      ).toBeNull();
    }

    const favoriteRoute = readFileSync(
      new URL("../app/api/favorites/route.ts", import.meta.url),
      "utf8",
    );
    const reportRoute = readFileSync(
      new URL("../app/api/reports/route.ts", import.meta.url),
      "utf8",
    );
    const reviewRoute = readFileSync(
      new URL("../app/api/review/route.ts", import.meta.url),
      "utf8",
    );
    expect(favoriteRoute).toContain("data: { listingId, saved: true }");
    expect(favoriteRoute).toContain("data: { listingId, saved: false }");
    expect(reportRoute).toContain(
      '.select("id,reporter_id,listing_id,status,created_at")',
    );
    expect(reportRoute).toContain("if (listingError) throw listingError");
    expect(reviewRoute).toContain(
      '.select("id,listing_id,author_id,rating,comment,created_at")',
    );
    expect(reviewRoute).toContain("if (roomError) throw roomError");
  });

  it("rejects malformed private account success responses", () => {
    const listing = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Kabinet kitabı",
      author: "Sınaq müəllifi",
      description: "Kabinet cavab sınağı",
      price: 9.5,
      category: "Fiction",
      condition: "Good",
      city: "Baku",
      status: "active",
      sellerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      seller: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Sınaq oxucusu",
      },
    };
    const profile = { name: "Sınaq oxucusu", phone: null, city: "Baku" };
    const userId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const privacyItem = {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      type: "access",
      status: "open",
      created_at: "2026-07-24T10:00:00.000Z",
    };

    expect(
      parseProfileDashboardResponse({
        data: { profile, listings: [listing], favoriteCount: 2 },
      }),
    ).toEqual({ profile, listings: [listing], favoriteCount: 2 });
    expect(
      parseProfileSaveResponse(
        { requesterId: userId, data: profile },
        { userId, profile },
      ),
    ).toEqual(profile);
    expect(parseFavoriteListingsResponse({ data: [listing] })).toEqual([
      listing,
    ]);
    expect(
      parseListingMutationResponse(
        { data: listing, imageCleanupPending: false },
        {
          listingId: listing.id,
          ownerId: listing.sellerId,
          status: "active",
        },
      ),
    ).toEqual({ listing, imageCleanupPending: false });
    expect(
      parseListingDeletionResponse(
        {
          listingId: listing.id,
          removed: true,
          retainedForIntegrity: true,
        },
        listing.id,
      ),
    ).toEqual({ retainedForIntegrity: true });
    expect(parsePrivacyRequestListResponse({ data: [privacyItem] })).toEqual([
      privacyItem,
    ]);
    expect(
      parsePrivacyRequestSubmissionResponse(
        { requesterId: userId, data: privacyItem },
        { userId, type: "access" },
      ),
    ).toEqual(privacyItem);

    expect(
      parseProfileDashboardResponse({
        data: { profile, listings: {}, favoriteCount: "2" },
      }),
    ).toBeNull();
    expect(
      parseProfileSaveResponse(
        { requesterId: userId, data: { ...profile, phone: 994 } },
        { userId, profile },
      ),
    ).toBeNull();
    expect(
      parseProfileSaveResponse(
        {
          requesterId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          data: profile,
        },
        { userId, profile },
      ),
    ).toBeNull();
    expect(
      parseProfileSaveResponse(
        { requesterId: userId, data: { ...profile, city: "Ganja" } },
        { userId, profile },
      ),
    ).toBeNull();
    expect(parseFavoriteListingsResponse({ data: {} })).toBeNull();
    expect(
      parsePrivacyRequestListResponse({
        data: [{ ...privacyItem, created_at: "not-a-date" }],
      }),
    ).toBeNull();
    expect(
      parsePrivacyRequestSubmissionResponse(
        {
          requesterId: userId,
          data: {
            ...privacyItem,
            status: "provider-status",
          },
        },
        { userId, type: "access" },
      ),
    ).toBeNull();
    expect(
      parsePrivacyRequestSubmissionResponse(
        {
          requesterId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          data: privacyItem,
        },
        { userId, type: "access" },
      ),
    ).toBeNull();
    expect(
      parsePrivacyRequestSubmissionResponse(
        {
          requesterId: userId,
          data: { ...privacyItem, type: "correction" },
        },
        { userId, type: "access" },
      ),
    ).toBeNull();
    const mutationExpectation = {
      listingId: listing.id,
      ownerId: listing.sellerId,
      status: "active" as const,
    };
    expect(
      parseListingMutationResponse(
        {
          data: { ...listing, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
          imageCleanupPending: false,
        },
        mutationExpectation,
      ),
    ).toBeNull();
    expect(
      parseListingMutationResponse(
        {
          data: { ...listing, status: "sold" },
          imageCleanupPending: false,
        },
        mutationExpectation,
      ),
    ).toBeNull();
    expect(
      parseListingMutationResponse(
        {
          data: {
            ...listing,
            sellerId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          },
          imageCleanupPending: false,
        },
        mutationExpectation,
      ),
    ).toBeNull();
    expect(
      parseListingMutationResponse(
        { data: listing, imageCleanupPending: "false" },
        mutationExpectation,
      ),
    ).toBeNull();
    expect(
      parseListingDeletionResponse(
        {
          listingId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          removed: true,
          retainedForIntegrity: true,
        },
        listing.id,
      ),
    ).toBeNull();
    expect(
      parseListingDeletionResponse(
        {
          listingId: listing.id,
          removed: "true",
          retainedForIntegrity: true,
        },
        listing.id,
      ),
    ).toBeNull();
    expect(
      parseListingDeletionResponse(
        {
          listingId: listing.id,
          removed: true,
          retainedForIntegrity: false,
        },
        listing.id,
      ),
    ).toBeNull();
    const listingRoute = readFileSync(
      new URL("../app/api/listings/[id]/route.ts", import.meta.url),
      "utf8",
    );
    expect(listingRoute).toContain("listingId: id");
    expect(listingRoute).toContain('.update({ status: "locked" })');
    expect(listingRoute).not.toContain('.from("listings")\n      .delete()');
    expect(listingRoute).toContain("retainedForIntegrity: true");
  });

  it("keeps owner lifecycle actions confirmed, owner-bound, and non-cascading", () => {
    const listingRoute = readFileSync(
      new URL("../app/api/listings/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const profileRoute = readFileSync(
      new URL("../app/api/profile/route.ts", import.meta.url),
      "utf8",
    );
    const chatRoomRoute = readFileSync(
      new URL("../app/api/chat/rooms/route.ts", import.meta.url),
      "utf8",
    );
    const profileDashboard = readFileSync(
      new URL("../components/profile-dashboard.tsx", import.meta.url),
      "utf8",
    );
    const listingDetail = readFileSync(
      new URL("../components/listing-detail.tsx", import.meta.url),
      "utf8",
    );
    const initialSchema = readFileSync(
      new URL("../supabase/migrations/202606140001_init.sql", import.meta.url),
      "utf8",
    );

    const deleteHandler = listingRoute.slice(
      listingRoute.indexOf("export async function DELETE"),
    );
    expect(deleteHandler).toContain('.eq("seller_id", user.id)');
    expect(deleteHandler).toContain('.update({ status: "locked" })');
    expect(deleteHandler).not.toContain(".delete()");
    expect(deleteHandler).not.toContain("drainListingImageCleanupJobs");
    expect(deleteHandler).toContain("retainedForIntegrity: true");
    expect(profileRoute).toContain('.neq("status", "locked")');
    expect(chatRoomRoute).toContain('listing.status !== "active"');
    expect(profileDashboard).toContain(
      "window.confirm(AZ_COPY.profile.soldConfirm)",
    );
    expect(profileDashboard).toContain(
      "window.confirm(AZ_COPY.profile.deleteConfirm)",
    );
    expect(listingDetail).toContain("listing.sellerId !== userId");
    expect(listingDetail).toContain(
      "window.confirm(AZ_COPY.listingDetail.soldConfirm)",
    );
    expect(listingDetail).toContain(
      "window.confirm(AZ_COPY.listingDetail.deleteConfirm)",
    );
    for (const retainedTable of ["chat_rooms", "reviews", "reports"]) {
      expect(initialSchema).toContain(
        `references public.listings(id) on delete cascade`,
      );
      expect(initialSchema).toContain(`create table public.${retainedTable}`);
    }
  });

  it("rejects malformed listing authoring and image success responses", async () => {
    const listing = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Elan cavab sınağı",
      author: "Sınaq müəllifi",
      description: "Elan yaratma cavabının etibarlı təsviri.",
      price: 15,
      images: [
        "https://fixture.supabase.co/storage/v1/object/public/listing-images/owner/book.png",
      ],
      category: "Fiction",
      condition: "Very good",
      city: "Baku",
      status: "active",
      seller: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Sınaq satıcısı",
      },
    };
    const uploadUrls = [listing.images[0]];

    expect(parseListingDataResponse({ data: listing })).toEqual(listing);
    expect(
      parseListingDataResponse(
        { data: listing },
        "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      ),
    ).toBeNull();
    expect(
      parseListingUpdateResponse({
        data: listing,
        imageCleanupPending: false,
      }),
    ).toEqual({ listing, imageCleanupPending: false });
    expect(
      parseListingUpdateResponse(
        { data: listing, imageCleanupPending: false },
        "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      ),
    ).toBeNull();
    expect(parseListingUploadResponse({ data: uploadUrls }, 1)).toEqual(
      uploadUrls,
    );
    expect(
      parseListingCleanupResponse(
        { accepted: 1, referenced: 0, cleanupPending: false },
        1,
      ),
    ).toEqual({ cleanupPending: false });
    expect(getResponseErrorCode({ code: "AUTH_REQUIRED" })).toBe(
      "AUTH_REQUIRED",
    );

    expect(parseListingDataResponse({ data: { id: listing.id } })).toBeNull();
    expect(
      parseListingUpdateResponse({
        data: listing,
        imageCleanupPending: "false",
      }),
    ).toBeNull();
    expect(parseListingUploadResponse({ data: {} }, 1)).toBeNull();
    expect(parseListingUploadResponse({ data: uploadUrls }, 2)).toBeNull();
    expect(
      parseListingUploadResponse({ data: ["javascript:alert(1)"] }, 1),
    ).toBeNull();
    expect(parseListingUploadResponse({ data: ["/icon.svg"] }, 1)).toBeNull();
    expect(
      parseListingUploadResponse({ data: [uploadUrls[0], uploadUrls[0]] }, 2),
    ).toBeNull();
    expect(
      parseListingCleanupResponse(
        { accepted: 0, referenced: 0, cleanupPending: "yes" },
        1,
      ),
    ).toBeNull();
    expect(
      parseListingCleanupResponse(
        { accepted: 2, referenced: 0, cleanupPending: false },
        1,
      ),
    ).toBeNull();
    expect(
      await readResponseJson(
        new Response("provider parser diagnostic", {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ).toBeNull();
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    await expect(
      readResponseJson({
        json: vi.fn().mockRejectedValue(abortError),
      } as unknown as Response),
    ).rejects.toBe(abortError);
  });

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
    expect(formatAdminAuditTarget("privacy_request")).toBe("Məxfilik sorğusu");
    expect(formatAdminAuditAction("listing.approved")).toBe("Elan təsdiqlənib");
    expect(formatAdminAuditState("listing", { status: "active" })).toBe(
      "Vəziyyət: Aktiv",
    );
    expect(formatAdminAuditState("user", { banned: true })).toBe(
      AZ_COPY.admin.accountSuspended,
    );
    expect(
      formatAdminAuditState("report", {
        status: "resolved",
        resolvedAt: "not-a-timestamp",
      }),
    ).toContain(AZ_COPY.admin.unknownValue);
    expect(formatModerationOutcome("approved")).toBe("Təsdiqlənib");
    expect(formatModerationOutcome("unavailable")).toBe(
      "Yoxlama əlçatan olmayıb",
    );
    expect(formatModerationSurface("chat_message")).toBe("Söhbət mesajı");
    expect(formatModerationContentType("image")).toBe("Şəkil");
    expect(formatModerationProvider("local_rules")).toBe("Yerli qaydalar");
    expect(formatModerationProvider("openai")).toBe("OpenAI Moderations");
    expect(formatModerationReason("LOCAL_RULES_PASSED")).toContain(
      "yerli qaydalar",
    );
    expect(formatModerationReason("PROVIDER_FLAGGED")).toContain("işarələyib");
    expect(formatModerationCategory("credential-theft")).toContain(
      "giriş məlumatı",
    );
    expect(formatModerationCategory("violence")).toBe("Zorakılıq");
    expect(formatAdminAuditAction("unknown.action")).toBe(
      AZ_COPY.admin.unknownValue,
    );
    expect(formatReviewSummary(4.5, 2)).toBe("2 rəyə əsasən 4,5");
    expect(formatLoadedBooks(7)).toBe("7 kitab yüklənib");
    expect(formatStars(5)).toBe("5 ulduz");
    expect(localizeApiError("REPORT_EXISTS", "fallback")).toContain(
      "açıq şikayətin",
    );
    expect(localizeApiError("UNKNOWN", "fallback")).toBe("fallback");
    expect(localizeApiError("ADMIN_ACTION_CONFLICT", "fallback")).toContain(
      "mümkün deyil",
    );
    expect(localizeApiError("INVALID_CURSOR", "fallback")).toContain(
      "göstəricisi",
    );
    expect(localizeApiError("SELLER_NOT_FOUND", "fallback")).toBe(
      AZ_COPY.api.sellerNotFound,
    );
    for (const code of [
      "AUTH_REQUIRED",
      "INVALID_SESSION",
      "PROFILE_UNAVAILABLE",
      "ACCOUNT_SUSPENDED",
      "RATE_LIMITED",
      "VALIDATION_ERROR",
      "BAD_REQUEST",
      "INTERNAL_ERROR",
      "AUTH_ACTION_NOT_FOUND",
      "INVALID_QUERY",
      "INVALID_FILTER",
      "INVALID_ID",
      "INVALID_SORT",
      "INVALID_LIMIT",
      "INVALID_CURSOR",
      "LISTING_NOT_FOUND",
      "LISTING_UNAVAILABLE",
      "SELLER_NOT_FOUND",
      "OWN_LISTING",
      "ROOM_NOT_FOUND",
      "ROOM_FORBIDDEN",
      "REPORT_EXISTS",
      "REVIEW_NOT_ALLOWED",
      "INVALID_IMAGE_COUNT",
      "INVALID_IMAGE_FILE",
      "INVALID_IMAGE_CONTENT",
      "INVALID_IMAGE_PATH",
      "LISTING_LOCKED",
      "MODERATION_AUDIT_UNAVAILABLE",
      "CONTENT_REJECTED",
      "ADMIN_REQUIRED",
      "SELF_BAN_FORBIDDEN",
      "TARGET_NOT_FOUND",
      "ADMIN_ACTION_FORBIDDEN",
      "ADMIN_ACTION_CONFLICT",
      "INVALID_ADMIN_ACTION",
    ]) {
      expect(localizeApiError(code, "unmapped-api-code")).not.toBe(
        "unmapped-api-code",
      );
    }
    expect(localizeAuthError({ code: "invalid_credentials" })).toBe(
      AZ_COPY.auth.invalidCredentials,
    );
    expect(localizeAuthError({ message: "provider detail" })).toBe(
      AZ_COPY.auth.failed,
    );
    expect(formatCategory("User supplied value")).toBe("User supplied value");
  });

  it("serializes API failures with safe Azerbaijani copy and stable codes", async () => {
    const invalidListing = listingInput.safeParse({
      title: "x",
      unexpected: "provider detail",
    });
    expect(invalidListing.success).toBe(false);
    if (invalidListing.success) throw new Error("Expected validation failure");

    const validationResponse = apiError(invalidListing.error);
    const validationBody = (await validationResponse.json()) as {
      error: string;
      code: string;
      details: Record<string, string[]>;
    };
    expect(validationResponse.status).toBe(422);
    expect(validationBody.error).toBe(AZ_COPY.api.invalidData);
    expect(validationBody.code).toBe("VALIDATION_ERROR");
    expect(Object.values(validationBody.details).flat()).not.toContain(
      "Required",
    );
    expect(new Set(Object.values(validationBody.details).flat())).toEqual(
      new Set([AZ_COPY.api.invalidField]),
    );

    const unexpectedResponse = apiError(
      new Error("database relation private_table failed"),
      400,
    );
    expect(await unexpectedResponse.json()).toEqual({
      error: AZ_COPY.api.badRequest,
      code: "BAD_REQUEST",
    });
  });

  it("renders optional notification email from reviewed Azerbaijani presentation", () => {
    const messageEmail = formatNotificationEmail("MESSAGE", {
      preview: '<img src=x onerror="alert(1)"> & salam',
    });
    expect(messageEmail.subject).toBe(
      AZ_COPY.notifications.emailMessageSubject,
    );
    expect(messageEmail.html).toContain('lang="az"');
    expect(messageEmail.html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; salam",
    );
    expect(messageEmail.html).not.toContain("<img");

    const systemEmail = formatNotificationEmail("SYSTEM", {
      message: "private provider detail",
    });
    expect(systemEmail.subject).toBe(AZ_COPY.notifications.emailSystemSubject);
    expect(systemEmail.html).toContain(AZ_COPY.notifications.systemFallback);
    expect(systemEmail.html).not.toContain("private provider detail");

    const approvedEmail = formatNotificationEmail("SYSTEM", {
      event: "listing.approved",
    });
    expect(approvedEmail.html).toContain(AZ_COPY.notifications.listingApproved);
  });

  it("keeps direct API and optional-email boundaries free of replaced raw copy", () => {
    const sources = [
      "../lib/api.ts",
      "../lib/auth.ts",
      "../lib/auth-response.ts",
      "../lib/notify.ts",
      "../lib/listing-images.ts",
      "../lib/listing-pagination.ts",
      "../app/api/auth/[action]/route.ts",
      "../app/api/listings/route.ts",
      "../app/api/listings/[id]/route.ts",
      "../app/api/sellers/[id]/route.ts",
      "../app/api/favorites/route.ts",
      "../app/api/reports/route.ts",
      "../app/api/review/route.ts",
      "../app/api/upload/route.ts",
    ]
      .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
      .join("\n");

    for (const oldCopy of [
      "Invalid request data",
      "Something went wrong",
      "Too many requests",
      "Authentication required",
      "Invalid or expired session",
      "Unknown auth action",
      "Search query is too long",
      "Unsupported category",
      "Unsupported city",
      "Unsupported condition",
      "Invalid maximum price",
      "Listing not found",
      "Seller not found",
      "New BookSwap message",
      "Your BookSwap listing was updated",
      "There is an update on your BookSwap account",
    ]) {
      expect(sources).not.toContain(oldCopy);
    }
    expect(
      readFileSync(new URL("../lib/api.ts", import.meta.url), "utf8"),
    ).not.toContain("error.message");
    expect(
      readFileSync(new URL("../lib/auth-response.ts", import.meta.url), "utf8"),
    ).toContain("localizeAuthError");
    expect(
      readFileSync(
        new URL("../app/api/auth/[action]/route.ts", import.meta.url),
        "utf8",
      ),
    ).toContain("localizedAuthResponse");
  });

  it("accepts only complete administrator dashboard response shapes", () => {
    const data = {
      listings: [],
      users: [],
      reports: [],
      privacyRequests: [],
      moderationDecisions: [],
      auditLog: [],
    };
    expect(parseAdminDashboardResponse({ data })).toEqual(data);
    expect(() =>
      parseAdminDashboardResponse({
        data: { ...data, users: [{ id: "not-a-uuid" }] },
      }),
    ).toThrow();
    expect(() =>
      parseAdminDashboardResponse({
        data: {
          ...data,
          users: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              name: "Sınaq idarəçisi",
              email: "admin@example.invalid",
              city: "Baku",
              banned: false,
              is_admin: true,
              created_at: "not-a-timestamp",
            },
          ],
        },
      }),
    ).toThrow();
    expect(() => parseAdminDashboardResponse({ data: [] })).toThrow();
  });

  it("keeps localized marketplace surfaces free of their old English copy", () => {
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
      "../app/messages/page.tsx",
      "../app/chat/[roomId]/page.tsx",
      "../app/notifications/page.tsx",
      "../components/messages-list.tsx",
      "../components/chat-panel.tsx",
      "../components/notifications-page.tsx",
      "../app/api/chat/rooms/route.ts",
      "../app/api/chat/rooms/[id]/route.ts",
      "../app/api/chat/message/route.ts",
      "../lib/chat.ts",
      "../lib/chat-client.ts",
      "../lib/client-listing-images.ts",
      "../lib/client-api.ts",
      "../app/admin/page.tsx",
      "../app/faq/page.tsx",
      "../app/safety/page.tsx",
      "../components/admin-panel.tsx",
      "../lib/admin-actions.ts",
      "../app/api/admin/ban/route.ts",
      "../app/api/admin/moderate/route.ts",
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
      "Reader to reader",
      "Messages.",
      "unread messages",
      "No conversations yet",
      "BookSwap conversation",
      "Discuss the book and arrange a safe exchange",
      "Write a message",
      "Send message",
      "About this book",
      "View listing",
      "Account updates",
      "Notifications.",
      "Mark all read",
      "BookSwap update",
      "There is an update on your account",
      "You are all caught up",
      "Protected administration",
      "Trust & safety",
      "Admin-role access",
      "Reason for the next administrator action",
      "Immutable administrator action history",
      "Recent listings",
      "Reader accounts",
      "Open reports",
      "Privacy & rights requests",
      "Automated content decisions",
      "No administrator actions",
      "Your listing was approved",
      "Your listing was rejected",
      "Safety Center",
      "Help center",
      "Dashboard → My Listings",
      "Mark sold",
      "Report this listing",
    ]) {
      expect(sources).not.toContain(oldCopy);
    }
  });

  it("keeps FAQ and safety guidance centralized within the accepted trust boundary", () => {
    const routeSources = ["../app/faq/page.tsx", "../app/safety/page.tsx"]
      .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
      .join("\n");
    const guidance = JSON.stringify({
      faq: AZ_COPY.faq,
      safety: AZ_COPY.safety,
    });

    expect(routeSources).toContain("AZ_COPY.faq");
    expect(routeSources).toContain("AZ_COPY.safety");
    expect(guidance).toContain("BookSwap vəsait saxlamır");
    expect(guidance).toContain("alıcı müdafiəsi təqdim etmir");
    expect(guidance).toContain("çatdırılmaya zəmanət vermir");
    expect(guidance).toContain("bütün iddialarını təsdiqləmir");
    expect(guidance).not.toContain("Yetkinlik yaşına");
    expect(guidance).not.toContain("Trust & safety");
    expect(new Set(AZ_COPY.safety.sections.map(({ id }) => id)).size).toBe(
      AZ_COPY.safety.sections.length,
    );
  });

  it("renders messaging dates and notification copy deterministically", () => {
    const timestamp = "2026-07-14T18:05:00.000Z";
    expect(formatAzTime(timestamp)).toBe("22:05");
    expect(formatAzDateTime(timestamp)).toBe("14 iyl 2026, 22:05");
    expect(
      formatNotificationPresentation("SYSTEM", {
        message: "Your listing was approved.",
      }),
    ).toEqual({
      title: AZ_COPY.notifications.systemTitle,
      body: AZ_COPY.notifications.listingApproved,
    });
    expect(
      formatNotificationPresentation("MESSAGE", {
        preview: "İstifadəçinin yazdığı mətn",
      }),
    ).toEqual({
      title: AZ_COPY.notifications.messageTitle,
      body: "İstifadəçinin yazdığı mətn",
    });

    const timestampSources = [
      "../components/messages-list.tsx",
      "../components/chat-panel.tsx",
      "../components/notifications-page.tsx",
    ]
      .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
      .join("\n");
    expect(timestampSources).not.toMatch(/\.toLocale(?:Time)?String\(/);
    expect(timestampSources).toContain("formatAzTime");
    expect(timestampSources).toContain("formatAzDateTime");
  });

  it("accepts only complete chat response shapes at the client boundary", () => {
    const timestamp = "2026-07-14T18:05:00.000Z";
    const seller = {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Murad Əliyev",
      city: "Baku",
    };
    const room = {
      id: "22222222-2222-4222-8222-222222222222",
      currentUserId: "11111111-1111-4111-8111-111111111111",
      buyer: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Aysel Məmmədli",
      },
      seller,
      listing: {
        id: "44444444-4444-4444-8444-444444444444",
        title: "Səfillər",
        author: "Viktor Hüqo",
        description: "Yaxşı saxlanmış nüsxə.",
        price: 17.5,
        category: "Fiction",
        condition: "Very good",
        city: "Baku",
        status: "active",
        seller,
      },
      unreadCount: 2,
      last_message_at: timestamp,
    };
    const message = {
      id: "55555555-5555-4555-8555-555555555555",
      sender_id: seller.id,
      text: "Kitab hələ satışdadır.",
      created_at: timestamp,
    };

    expect(parseChatRoomSummaries([room])).toHaveLength(1);
    expect(parseChatRoomDetail({ ...room, messages: [message] })).toMatchObject(
      {
        unreadCount: 2,
        messages: [message],
      },
    );
    expect(parseChatMessage(message)).toEqual(message);
    expect(parseChatRoomSummaries([{ ...room, unreadCount: "2" }])).toBeNull();
    expect(
      parseChatRoomSummaries([{ ...room, last_message_at: "not-a-date" }]),
    ).toBeNull();
    expect(
      parseChatMessage({ ...message, created_at: "not-a-date" }),
    ).toBeNull();
    expect(
      parseChatRoomDetail({ ...room, messages: [{ text: "missing" }] }),
    ).toBeNull();
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
    expect(profileRoute).toContain("requesterId: user.id");
    expect(profileRoute).toContain(
      "if (listingsResult.error) throw listingsResult.error",
    );
    expect(profileRoute).toContain(
      "if (favoritesResult.error) throw favoritesResult.error",
    );
    expect(profileRoute.match(/apiError\(error, 500, request\)/g)).toHaveLength(
      2,
    );
    expect(privacyRoute.match(/apiError\(error, 500, request\)/g)).toHaveLength(
      2,
    );
    expect(privacyRoute).toContain("requesterId: user.id");
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

  it("checks the final text whenever a listing becomes public", () => {
    expect(
      planListingUpdateModeration({
        currentStatus: "draft",
        requestedStatus: "active",
        textChanged: false,
      }),
    ).toEqual({ moderateText: true });
    expect(
      planListingUpdateModeration({
        currentStatus: "sold",
        requestedStatus: "active",
        textChanged: false,
      }),
    ).toEqual({ moderateText: true });
  });

  it("skips unchanged text while an active listing stays public", () => {
    expect(
      planListingUpdateModeration({
        currentStatus: "active",
        requestedStatus: "active",
        textChanged: false,
      }),
    ).toEqual({ moderateText: false });
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
    expect(low).toMatchObject({ id: row.id, price: 17.5, sort: "price-low" });
    expect(high).toMatchObject({
      id: row.id,
      price: 17.5,
      sort: "price-high",
    });
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

  it("approves normal marketplace text without credentials or network access", async () => {
    const fetchMock = vi.fn(() => {
      throw new Error("Network access is forbidden in local content checks");
    });
    vi.stubGlobal("fetch", fetchMock);
    const decision = await moderateText("Normal marketplace description");
    expect(decision).toMatchObject({
      outcome: "approved",
      provider: "local_rules",
      reasonCode: "LOCAL_RULES_PASSED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(() => assertModerationApproved(decision)).not.toThrow();
  });

  it("keeps external AI configuration and network endpoints out of runtime files", () => {
    const runtimeSources = [
      "../lib/moderation.ts",
      "../app/api/listings/route.ts",
      "../app/api/listings/[id]/route.ts",
      "../app/api/chat/message/route.ts",
      "../.env.example",
      "../.env.local.example",
      "../supabase/config.toml",
      "../package.json",
      "../package-lock.json",
    ]
      .map((relativePath) =>
        readFileSync(new URL(relativePath, import.meta.url), "utf8"),
      )
      .join("\n");

    expect(runtimeSources).not.toContain("OPENAI_API_KEY");
    expect(runtimeSources).not.toContain("api.openai.com");
    expect(runtimeSources).not.toContain('"openai":');
  });

  it("rejects a narrow credential-theft request deterministically", async () => {
    const decision = await moderateText("CVV kodunu göndər");
    expect(decision).toMatchObject({
      outcome: "rejected",
      provider: "local_rules",
      reasonCode: "SENSITIVE_AUTH_CODE_REQUEST",
      categories: ["credential-theft"],
    });
    expect(() => assertModerationApproved(decision)).toThrow(
      "təhlükəsizlik qaydalarına",
    );
  });

  it("records decision metadata without storing submitted content", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert })) };
    await moderateAndRecordText(
      supabase as never,
      "Private text that must not enter the ledger",
      {
        actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        surface: "chat_message",
      },
    );
    expect(supabase.from).toHaveBeenCalledWith("moderation_decisions");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: "approved",
        provider: "local_rules",
        reason_code: "LOCAL_RULES_PASSED",
      }),
    );
    expect(JSON.stringify(insert.mock.calls[0][0])).not.toContain(
      "Private text",
    );
  });

  it("fails closed when the moderation ledger cannot be written", async () => {
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: { message: "denied" } }),
      })),
    };
    await expect(
      moderateAndRecordText(supabase as never, "Normal text", {
        actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        surface: "chat_message",
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
    const adminPage = readFileSync(
      new URL("../app/admin/page.tsx", import.meta.url),
      "utf8",
    );
    const adminAuditMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260714073000_add_transactional_admin_audit.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const moderationLibrary = readFileSync(
      new URL("../lib/moderation.ts", import.meta.url),
      "utf8",
    );
    const listingCreateRoute = readFileSync(
      new URL("../app/api/listings/route.ts", import.meta.url),
      "utf8",
    );
    const messageCreateRoute = readFileSync(
      new URL("../app/api/chat/message/route.ts", import.meta.url),
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
    expect(moderationRoute).toContain('"listing.approved"');
    expect(moderationRoute).toContain('"listing.rejected"');
    expect(moderationRoute).toContain("AZ_COPY.notifications.listingApproved");
    expect(moderationRoute).not.toContain('.from("listings")');
    expect(adminBanRoute).toContain("admin_set_user_ban");
    expect(adminReportsRoute).toContain("admin_resolve_report");
    expect(adminPrivacyRoute).toContain("admin_resolve_privacy_request");
    expect(adminDashboardRoute).toContain('.from("admin_audit_log")');
    expect(adminDashboardRoute).toContain("listingsError");
    expect(adminDashboardRoute).toContain("auditError");
    expect(adminPanel).toContain("admin-action-reason");
    expect(adminPanel).toContain("AZ_COPY.admin.historyTitle");
    expect(adminPanel).toContain("parseAdminDashboardResponse");
    expect(adminPanel).toContain("formatAzDateTime");
    expect(adminPanel).not.toContain("new Intl.DateTimeFormat");
    expect(adminPanel).not.toContain("body.error");
    expect(adminPage).toContain("AZ_COPY.admin.metadataTitle");
    expect(adminPage).toContain("index: false, follow: false");
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
    expect(moderationLibrary).not.toContain("fetch(");
    expect(moderationLibrary).not.toContain("process.env");
    expect(moderationLibrary).toContain('provider: "local_rules"');
    expect(listingCreateRoute).toContain("moderateAndRecordText");
    expect(listingCreateRoute).not.toContain("moderateAndRecordImage");
    expect(messageCreateRoute).toContain("moderateAndRecordText");
    expect(messageCreateRoute).not.toContain("fetch(");
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

  it("keeps marketplace client and cover delivery costs bounded", () => {
    const home = readFileSync(
      new URL("../app/page.tsx", import.meta.url),
      "utf8",
    );
    const homeMarketplace = readFileSync(
      new URL("../components/home-marketplace-sections.tsx", import.meta.url),
      "utf8",
    );
    const homeListingsHook = readFileSync(
      new URL("../hooks/use-home-listings.ts", import.meta.url),
      "utf8",
    );
    const bookCard = readFileSync(
      new URL("../components/book-card.tsx", import.meta.url),
      "utf8",
    );
    const motionReveal = readFileSync(
      new URL("../components/motion-reveal.tsx", import.meta.url),
      "utf8",
    );
    const bookCover = readFileSync(
      new URL("../components/book-cover.tsx", import.meta.url),
      "utf8",
    );
    const bookSkeleton = readFileSync(
      new URL("../components/book-skeleton.tsx", import.meta.url),
      "utf8",
    );
    const sellerProfile = readFileSync(
      new URL("../components/seller-profile.tsx", import.meta.url),
      "utf8",
    );
    const listingDetail = readFileSync(
      new URL("../components/listing-detail.tsx", import.meta.url),
      "utf8",
    );
    const nextConfig = readFileSync(
      new URL("../next.config.js", import.meta.url),
      "utf8",
    );
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );

    expect(home.startsWith('"use client"')).toBe(false);
    expect(home).toContain("HomeListingSection");
    expect(homeMarketplace.startsWith('"use client"')).toBe(true);
    expect(homeMarketplace).toContain("useHomeListings()");
    expect(homeListingsHook).toContain("pending ??= fetch");
    expect(bookCard).not.toContain("framer-motion");
    expect(motionReveal).not.toContain("framer-motion");
    expect(packageJson.dependencies["framer-motion"]).toBeUndefined();

    expect(bookCover).toContain('from "next/image"');
    expect(bookCover).toContain("sizes={sizes}");
    expect(bookCover).toContain("quality={72}");
    expect(bookCover).toContain("isLocalPreview");
    expect(bookSkeleton).toContain("market-book-card animate-pulse");
    expect(sellerProfile).toContain("[overflow-wrap:anywhere]");
    expect(listingDetail).not.toContain("unoptimized");
    expect(nextConfig).toContain('hostname: "*.supabase.co"');
    expect(nextConfig).toContain(
      'pathname: "/storage/v1/object/public/listing-images/**"',
    );
    expect(packageJson.scripts["test:performance"]).toBe(
      "node scripts/check-performance-budgets.mjs",
    );
  });

  it("keeps marketplace Web Vitals grouped and free of reader identifiers", () => {
    const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const sellerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    expect(classifyMarketplaceVitalRoute("/")).toBe("home");
    expect(classifyMarketplaceVitalRoute("/listings")).toBe("catalog");
    expect(classifyMarketplaceVitalRoute(`/listings/${listingId}`)).toBe(
      "listing-detail",
    );
    expect(classifyMarketplaceVitalRoute(`/sellers/${sellerId}`)).toBe(
      "seller-storefront",
    );
    expect(classifyMarketplaceVitalRoute("/messages")).toBeNull();
    expect(classifyMarketplaceVitalRoute("/listings/new")).toBeNull();
    expect(
      classifyMarketplaceVitalRoute(`/listings/${listingId}/edit`),
    ).toBeNull();

    const payload = createWebVitalPayload({
      name: "LCP",
      value: 1_725.25,
      navigationType: "navigate",
      pathname: `/listings/${listingId}`,
    });
    expect(payload).toEqual({
      version: 1,
      name: "LCP",
      value: 1_725.25,
      route: "listing-detail",
      navigationType: "navigate",
    });
    expect(JSON.stringify(payload)).not.toContain(listingId);
    expect(JSON.stringify(payload)).not.toContain("id");
    expect(JSON.stringify(payload)).not.toContain("url");
    expect(
      createWebVitalPayload({
        name: "FID",
        value: 10,
        navigationType: "navigate",
        pathname: "/",
      }),
    ).toBeNull();
    expect(
      createWebVitalPayload({
        name: "CLS",
        value: Number.POSITIVE_INFINITY,
        navigationType: "navigate",
        pathname: "/",
      }),
    ).toBeNull();
    expect(
      createWebVitalPayload({
        name: "INP",
        value: 120,
        navigationType: "unknown",
        pathname: "/listings",
      }),
    ).toBeNull();
    expect(rateWebVital("LCP", 2_500)).toBe("good");
    expect(rateWebVital("LCP", 2_501)).toBe("needs-improvement");
    expect(rateWebVital("CLS", 0.251)).toBe("poor");
    expect(rateWebVital("INP", 200)).toBe("good");
  });

  it("keeps the RUM endpoint opt-in, bounded, and same-origin", async () => {
    delete process.env.WEB_VITALS_ENABLED;
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const validBody = JSON.stringify({
      version: 1,
      name: "LCP",
      value: 1_725.25,
      route: "home",
      navigationType: "navigate",
    });
    const request = (body: string, headers: Record<string, string> = {}) =>
      new Request("http://localhost:3000/api/vitals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "sec-fetch-site": "same-origin",
          "x-forwarded-for": "192.0.2.10",
          ...headers,
        },
        body,
      });

    expect((await reportWebVital(request(validBody))).status).toBe(204);
    expect(log).not.toHaveBeenCalled();

    process.env.WEB_VITALS_ENABLED = "true";
    expect((await reportWebVital(request(validBody))).status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      level: "info",
      event: "bookswap.web_vital",
      version: 1,
      name: "LCP",
      value: 1_725.25,
      route: "home",
      navigationType: "navigate",
      rating: "good",
    });

    const crossOrigin = request(validBody, {
      origin: "https://tracker.example",
      "sec-fetch-site": "cross-site",
      "x-forwarded-for": "192.0.2.11",
    });
    expect((await reportWebVital(crossOrigin)).status).toBe(403);
    const proxiedSameOrigin = new Request(
      "http://internal-runtime:3000/api/vitals",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://books.example",
          host: "internal-runtime:3000",
          "sec-fetch-site": "same-origin",
          "x-forwarded-host": "books.example",
          "x-forwarded-proto": "https",
          "x-forwarded-for": "192.0.2.14",
        },
        body: validBody,
      },
    );
    expect((await reportWebVital(proxiedSameOrigin)).status).toBe(204);
    expect(
      (
        await reportWebVital(
          request(
            JSON.stringify({
              ...JSON.parse(validBody),
              id: "reader-page-load-id",
            }),
            { "x-forwarded-for": "192.0.2.12" },
          ),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await reportWebVital(
          request("x".repeat(1_025), {
            "content-type": "application/json",
            "x-forwarded-for": "192.0.2.13",
          }),
        )
      ).status,
    ).toBe(413);
    expect(log).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });

  it("keeps RUM provider-neutral and production-gated at the shell", () => {
    const component = readFileSync(
      new URL("../components/web-vitals-reporter.tsx", import.meta.url),
      "utf8",
    );
    const route = readFileSync(
      new URL("../app/api/vitals/route.ts", import.meta.url),
      "utf8",
    );
    const layout = readFileSync(
      new URL("../app/layout.tsx", import.meta.url),
      "utf8",
    );
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );

    expect(component).toContain('from "next/web-vitals"');
    expect(component).toContain("navigator.sendBeacon");
    expect(component).toContain("keepalive: true");
    expect(component).toContain("window.location.pathname");
    expect(component).not.toContain("metric.id");
    expect(component).not.toContain("metric.entries");
    expect(component).not.toContain("location.search");
    expect(route).toContain("MAX_BODY_BYTES = 1_024");
    expect(route).toContain('assertRateLimit(request, "web-vitals"');
    expect(route).toContain('logServerEvent("info", "bookswap.web_vital"');
    expect(layout).toContain(
      'enabled={process.env.WEB_VITALS_ENABLED === "true"}',
    );
    expect(packageJson.dependencies["@vercel/analytics"]).toBeUndefined();
    expect(packageJson.dependencies["@vercel/speed-insights"]).toBeUndefined();
  });

  it("keeps deep marketplace cursors indexable and query plans replayable", () => {
    const catalogRoute = readFileSync(
      new URL("../app/api/listings/route.ts", import.meta.url),
      "utf8",
    );
    const sellerRoute = readFileSync(
      new URL("../app/api/sellers/[id]/route.ts", import.meta.url),
      "utf8",
    );
    const planProbe = readFileSync(
      new URL("../supabase/tests/marketplace_query_plans.sql", import.meta.url),
      "utf8",
    );
    const marketplaceRpcMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260724090000_add_public_marketplace_page_rpcs.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const rpcContainmentMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260724093000_contain_marketplace_page_rpcs.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const rpcInputHardeningMigration = readFileSync(
      new URL(
        "../supabase/migrations/20260724094500_reject_null_marketplace_sort.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(catalogRoute).toContain('.rpc("catalog_listings_page"');
    expect(catalogRoute).toContain("p_cursor_created_at:");
    expect(catalogRoute).toContain("p_cursor_price:");
    expect(sellerRoute).toContain('.rpc("seller_listings_page"');
    expect(sellerRoute).toContain("p_cursor_created_at:");

    expect(planProbe).toContain("explain (analyze, buffers, format json)");
    expect(planProbe).toContain("from generate_series(1, 60000)");
    expect(planProbe).toContain("catalog_newest_cursor");
    expect(planProbe).toContain("catalog_price_low_cursor");
    expect(planProbe).toContain("seller_inventory_cursor");
    expect(planProbe).toContain('"Rows Removed by Filter" > 100');
    expect(planProbe).toContain("Representative query-plan fixture cleanup");
    expect(marketplaceRpcMigration).toContain("security definer");
    expect(marketplaceRpcMigration).toContain("set search_path = ''");
    expect(marketplaceRpcMigration).toContain("and not seller_row.banned");
    expect(marketplaceRpcMigration).toContain(
      "websearch_to_tsquery('simple', $1)",
    );
    expect(marketplaceRpcMigration).toContain(
      "(listing.price, listing.id) > ($8, $9)",
    );
    expect(marketplaceRpcMigration).toContain("to anon, authenticated");
    expect(rpcContainmentMigration).toContain("set schema private");
    expect(rpcContainmentMigration).toContain("security invoker");
    expect(rpcContainmentMigration).toContain(
      "from private.catalog_listings_page(",
    );
    expect(rpcContainmentMigration).toContain(
      "from private.seller_listings_page(",
    );
    expect(rpcInputHardeningMigration).toContain("if p_sort is null then");
    expect(rpcInputHardeningMigration).toContain("security invoker");
  });

  it("keeps legal copy, signup consent, and audit storage on one version", () => {
    const terms = readFileSync(
      new URL("../app/terms/page.tsx", import.meta.url),
      "utf8",
    );
    const privacy = readFileSync(
      new URL("../app/privacy/page.tsx", import.meta.url),
      "utf8",
    );
    const rules = readFileSync(
      new URL("../app/marketplace-rules/page.tsx", import.meta.url),
      "utf8",
    );
    const footer = readFileSync(
      new URL("../components/site-footer.tsx", import.meta.url),
      "utf8",
    );
    const signup = readFileSync(
      new URL("../components/auth-panel.tsx", import.meta.url),
      "utf8",
    );
    const authRoute = readFileSync(
      new URL("../app/api/auth/[action]/route.ts", import.meta.url),
      "utf8",
    );
    const supabaseClients = readFileSync(
      new URL("../lib/supabase.ts", import.meta.url),
      "utf8",
    );
    const migration = readFileSync(
      new URL(
        "../supabase/migrations/20260807090000_add_legal_acceptance_audit.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(terms).toContain('title="İstifadə şərtləri"');
    expect(terms).toContain("18 yaşı tamam olmuş");
    expect(terms).toContain("satış komissiyası");
    expect(terms).toContain("escrow");
    expect(privacy).toContain("LEGAL_VERSION");
    expect(rules).toContain('title="Kitab bazarı və icma qaydaları"');
    for (const href of [
      "/terms",
      "/privacy",
      "/marketplace-rules",
      "/safety",
      "/user-rights",
      "/moderation-appeals",
    ]) {
      expect(footer).toContain(`href="${href}"`);
    }
    expect(signup).toContain('name="termsAccepted"');
    expect(signup).toContain('name="privacyAccepted"');
    expect(signup).toContain("checked={termsAccepted}");
    expect(signup).toContain("checked={privacyAccepted}");
    expect(signup).toContain('fetch("/api/auth/signup"');
    expect(authRoute).toContain("getSupabasePublicServerClient");
    expect(authRoute).not.toContain("getSupabaseAdmin");
    expect(supabaseClients).toContain("persistSession: false");
    expect(supabaseClients).toContain("detectSessionInUrl: false");
    expect(migration).toContain("create table public.legal_acceptances");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("revoke all on table public.legal_acceptances");
    expect(migration).toContain(
      'create policy "Users view their own legal acceptances"',
    );
    expect(migration).not.toContain("grant insert");
    expect(migration).not.toContain("grant update");
    expect(migration).toContain(
      "grant delete on table public.legal_acceptances to service_role",
    );
  });
});
