import { isResponseRecord } from "./client-responses";
import type { ListingReview } from "./marketplace-responses";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function parseFavoriteLookupResponse(
  value: unknown,
  expectedListingId: string,
): { saved: boolean } | null {
  if (!isResponseRecord(value) || !isResponseRecord(value.data)) return null;
  return value.data.listingId === expectedListingId &&
    typeof value.data.saved === "boolean"
    ? { saved: value.data.saved }
    : null;
}

export function parseFavoriteMutationResponse(
  value: unknown,
  expectedListingId: string,
  expectedSaved: boolean,
): { saved: boolean } | null {
  if (
    !isResponseRecord(value) ||
    !isResponseRecord(value.data) ||
    value.data.listingId !== expectedListingId ||
    typeof value.data.saved !== "boolean" ||
    value.data.saved !== expectedSaved
  )
    return null;
  return { saved: value.data.saved };
}

export function parseRoomCreationResponse(
  value: unknown,
  expected: { listingId: string; buyerId: string; sellerId: string },
): { id: string } | null {
  if (!isResponseRecord(value) || !isResponseRecord(value.data)) return null;
  const room = value.data;
  if (
    !isUuid(room.id) ||
    room.listing_id !== expected.listingId ||
    room.buyer_id !== expected.buyerId ||
    room.seller_id !== expected.sellerId
  )
    return null;
  return { id: room.id };
}

export function parseReportCreationResponse(
  value: unknown,
  expected: { listingId: string; reporterId: string },
): { id: string } | null {
  if (!isResponseRecord(value) || !isResponseRecord(value.data)) return null;
  return isUuid(value.data.id) &&
    value.data.listing_id === expected.listingId &&
    value.data.reporter_id === expected.reporterId &&
    value.data.status === "open" &&
    isTimestamp(value.data.created_at)
    ? { id: value.data.id }
    : null;
}

export function parseReviewCreationResponse(
  value: unknown,
  expected: {
    listingId: string;
    authorId: string;
    rating: number;
    comment: string;
  },
): ListingReview | null {
  if (!isResponseRecord(value) || !isResponseRecord(value.data)) return null;
  const review = value.data;
  if (
    !isUuid(review.id) ||
    review.listing_id !== expected.listingId ||
    review.author_id !== expected.authorId ||
    !Number.isInteger(review.rating) ||
    Number(review.rating) < 1 ||
    Number(review.rating) > 5 ||
    review.rating !== expected.rating ||
    typeof review.comment !== "string" ||
    review.comment !== expected.comment ||
    !isTimestamp(review.created_at)
  )
    return null;
  return {
    id: review.id,
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.created_at,
  };
}
