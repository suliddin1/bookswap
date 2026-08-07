import { parseListing, parseListingArray } from "./marketplace-responses";
import type { Listing } from "./types";

export const PRIVACY_REQUEST_TYPES = [
  "access",
  "correction",
  "export",
  "deletion",
  "consent_withdrawal",
  "objection",
  "appeal",
] as const;

export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number];

const privacyRequestStatuses = [
  "open",
  "in_progress",
  "completed",
  "rejected",
] as const;

export type ProfileRecord = {
  name: string;
  phone: string | null;
  city: string | null;
};

export type ProfileDashboardData = {
  profile: ProfileRecord;
  listings: Listing[];
  favoriteCount: number;
};

export type PrivacyRequestItem = {
  id: string;
  type: PrivacyRequestType;
  status: (typeof privacyRequestStatuses)[number];
  created_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parseProfileRecord(value: unknown): ProfileRecord | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.name !== "string" ||
    (value.phone !== null && typeof value.phone !== "string") ||
    (value.city !== null && typeof value.city !== "string")
  )
    return null;
  return {
    name: value.name,
    phone: value.phone,
    city: value.city,
  };
}

function parsePrivacyRequestItem(value: unknown): PrivacyRequestItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.type !== "string" ||
    !PRIVACY_REQUEST_TYPES.includes(
      value.type as (typeof PRIVACY_REQUEST_TYPES)[number],
    ) ||
    typeof value.status !== "string" ||
    !privacyRequestStatuses.includes(
      value.status as (typeof privacyRequestStatuses)[number],
    ) ||
    !isTimestamp(value.created_at)
  )
    return null;
  return value as PrivacyRequestItem;
}

export function parseProfileDashboardResponse(
  value: unknown,
): ProfileDashboardData | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const profile = parseProfileRecord(value.data.profile);
  const listings = parseListingArray(value.data.listings);
  const favoriteCount = value.data.favoriteCount;
  if (
    !profile ||
    !listings ||
    !Number.isInteger(favoriteCount) ||
    Number(favoriteCount) < 0
  )
    return null;
  return { profile, listings, favoriteCount: Number(favoriteCount) };
}

export function parseProfileSaveResponse(
  value: unknown,
  expected: { userId: string; profile: ProfileRecord },
): ProfileRecord | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const profile = parseProfileRecord(value.data);
  if (
    !profile ||
    value.requesterId !== expected.userId ||
    profile.name !== expected.profile.name ||
    profile.phone !== expected.profile.phone ||
    profile.city !== expected.profile.city
  )
    return null;
  return profile;
}

export function parsePrivacyRequestListResponse(
  value: unknown,
): PrivacyRequestItem[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const items = value.data.map(parsePrivacyRequestItem);
  return items.every((item): item is PrivacyRequestItem => item !== null)
    ? items
    : null;
}

export function parsePrivacyRequestSubmissionResponse(
  value: unknown,
  expected: { userId: string; type: PrivacyRequestType },
): PrivacyRequestItem | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const item = parsePrivacyRequestItem(value.data);
  if (
    !item ||
    value.requesterId !== expected.userId ||
    item.type !== expected.type ||
    item.status !== "open"
  )
    return null;
  return item;
}

export function parseFavoriteListingsResponse(
  value: unknown,
): Listing[] | null {
  return isRecord(value) ? parseListingArray(value.data) : null;
}

export function parseListingMutationResponse(
  value: unknown,
  expected: {
    listingId: string;
    ownerId: string;
    status: "active" | "sold";
  },
): { listing: Listing; imageCleanupPending: boolean } | null {
  if (!isRecord(value) || typeof value.imageCleanupPending !== "boolean")
    return null;
  const listing = parseListing(value.data);
  if (
    !listing ||
    listing.id !== expected.listingId ||
    listing.status !== expected.status ||
    listing.sellerId !== expected.ownerId ||
    listing.seller.id !== expected.ownerId
  )
    return null;
  return { listing, imageCleanupPending: value.imageCleanupPending };
}

export function parseListingDeletionResponse(
  value: unknown,
  expectedListingId: string,
): { retainedForIntegrity: true } | null {
  if (
    !isRecord(value) ||
    value.listingId !== expectedListingId ||
    value.removed !== true ||
    value.retainedForIntegrity !== true
  )
    return null;
  return { retainedForIntegrity: true };
}
