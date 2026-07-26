import { parseListing } from "./marketplace-responses";
import type { Listing } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

export async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError"
    )
      throw error;
    return null;
  }
}

export function getResponseErrorCode(value: unknown): unknown {
  return isRecord(value) ? value.code : undefined;
}

export function parseListingDataResponse(
  value: unknown,
  expectedId?: string,
): Listing | null {
  const listing = isRecord(value) ? parseListing(value.data) : null;
  return listing && (!expectedId || listing.id === expectedId) ? listing : null;
}

export function parseListingUpdateResponse(
  value: unknown,
  expectedId?: string,
): {
  listing: Listing;
  imageCleanupPending: boolean;
} | null {
  if (!isRecord(value) || typeof value.imageCleanupPending !== "boolean")
    return null;
  const listing = parseListing(value.data);
  return listing && (!expectedId || listing.id === expectedId)
    ? { listing, imageCleanupPending: value.imageCleanupPending }
    : null;
}

export function parseListingUploadResponse(
  value: unknown,
  expectedCount: number,
): string[] | null {
  if (!isRecord(value) || !Number.isInteger(expectedCount) || expectedCount < 1)
    return null;
  const images = value.data;
  if (
    !Array.isArray(images) ||
    images.length !== expectedCount ||
    images.some((image) => !isListingImageUrl(image)) ||
    new Set(images).size !== images.length
  )
    return null;
  return images;
}

function isListingImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith("/storage/v1/object/public/listing-images/") &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function parseListingCleanupResponse(
  value: unknown,
  expectedCount: number,
): { cleanupPending: boolean } | null {
  if (
    !isRecord(value) ||
    !Number.isInteger(expectedCount) ||
    expectedCount < 0 ||
    !isNonNegativeInteger(value.accepted) ||
    !isNonNegativeInteger(value.referenced) ||
    value.accepted + value.referenced !== expectedCount ||
    typeof value.cleanupPending !== "boolean"
  )
    return null;
  return { cleanupPending: value.cleanupPending };
}
