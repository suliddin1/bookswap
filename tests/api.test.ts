import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  favoriteInput,
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
      images: ["https://project.supabase.co/storage/v1/object/public/listing-images/user-1/cover.jpg"],
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
    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
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
});
