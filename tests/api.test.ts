import { describe, expect, it } from "vitest";
import { listingInput, messageInput, reviewInput } from "../lib/api";

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
    });
    expect(listing.images).toEqual([]);
  });

  it("limits chat message length", () => {
    expect(() => messageInput.parse({ roomId: "room-1", text: "x".repeat(2001) })).toThrow();
  });

  it("only accepts five-star review scale", () => {
    expect(() => reviewInput.parse({ listingId: "one", rating: 6, comment: "Nice book" })).toThrow();
  });
});
