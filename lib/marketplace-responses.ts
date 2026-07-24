import type { Listing, ListingStatus, Seller } from "@/lib/types";

const listingStatuses: ListingStatus[] = ["draft", "active", "sold", "locked"];

export type ListingReview = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  author?: { name?: string } | null;
};

export type PublicSeller = {
  id: string;
  name: string;
  city: string | null;
  createdAt: string;
  initials: string;
  rating: number | null;
  reviewCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isOptionalFiniteNumber(value: unknown) {
  return value === undefined || isFiniteNumber(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isOptionalTimestamp(value: unknown) {
  return value === undefined || isTimestamp(value);
}

function isSeller(value: unknown): value is Seller {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isOptionalString(value.initials) &&
    isOptionalString(value.city) &&
    isOptionalFiniteNumber(value.rating) &&
    isOptionalFiniteNumber(value.reviews) &&
    isOptionalString(value.joined)
  );
}

function isListing(value: unknown): value is Listing {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.author === "string" &&
    typeof value.description === "string" &&
    isFiniteNumber(value.price) &&
    typeof value.category === "string" &&
    typeof value.condition === "string" &&
    typeof value.city === "string" &&
    typeof value.status === "string" &&
    listingStatuses.includes(value.status as ListingStatus) &&
    isSeller(value.seller) &&
    isOptionalString(value.isbn) &&
    isOptionalFiniteNumber(value.originalPrice) &&
    (value.images === undefined ||
      (Array.isArray(value.images) &&
        value.images.every((image) => typeof image === "string"))) &&
    isOptionalString(value.color) &&
    isOptionalString(value.accent) &&
    isOptionalString(value.sellerId) &&
    isOptionalString(value.posted) &&
    isOptionalTimestamp(value.createdAt) &&
    isOptionalFiniteNumber(value.saves) &&
    (value.featured === undefined || typeof value.featured === "boolean")
  );
}

function isListingReview(value: unknown): value is ListingReview {
  if (!isRecord(value)) return false;
  const author = value.author;
  return (
    typeof value.id === "string" &&
    Number.isInteger(value.rating) &&
    Number(value.rating) >= 1 &&
    Number(value.rating) <= 5 &&
    typeof value.comment === "string" &&
    isTimestamp(value.created_at) &&
    (author === undefined ||
      author === null ||
      (isRecord(author) && isOptionalString(author.name)))
  );
}

function isPublicSeller(value: unknown): value is PublicSeller {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.city === null || typeof value.city === "string") &&
    isTimestamp(value.createdAt) &&
    typeof value.initials === "string" &&
    (value.rating === null || isFiniteNumber(value.rating)) &&
    Number.isInteger(value.reviewCount) &&
    Number(value.reviewCount) >= 0
  );
}

export function parseListingPageResponse(value: unknown): {
  items: Listing[];
  nextCursor: string | null;
} | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const { items, nextCursor } = value.data;
  if (
    !Array.isArray(items) ||
    !items.every(isListing) ||
    (nextCursor !== null && typeof nextCursor !== "string")
  )
    return null;
  return { items, nextCursor };
}

export function parseListingDetailResponse(
  value: unknown,
): (Listing & { reviews?: ListingReview[] }) | null {
  if (!isRecord(value) || !isRecord(value.data) || !isListing(value.data))
    return null;
  const reviews = (value.data as Record<string, unknown>).reviews;
  if (
    reviews !== undefined &&
    (!Array.isArray(reviews) || !reviews.every(isListingReview))
  )
    return null;
  return value.data as Listing & { reviews?: ListingReview[] };
}

export function parseSellerResponse(value: unknown): {
  seller: PublicSeller;
  items: Listing[];
  nextCursor: string | null;
} | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const { seller, items, nextCursor } = value.data;
  if (
    !isPublicSeller(seller) ||
    !Array.isArray(items) ||
    !items.every(isListing) ||
    (nextCursor !== null && typeof nextCursor !== "string")
  )
    return null;
  return { seller, items, nextCursor };
}
