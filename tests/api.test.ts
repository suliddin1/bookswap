import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  favoriteInput,
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

describe("marketplace input validation", () => {
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

    expect(messageRoute).not.toContain("broadcast");
    expect(messageRoute).not.toContain(".channel(");
    expect(chatHook).not.toContain("broadcast");
    expect(chatHook).toContain('"postgres_changes"');
    expect(chatPanel).toContain('"postgres_changes"');
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
    expect(editForm).toContain("Remove current photo");
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
