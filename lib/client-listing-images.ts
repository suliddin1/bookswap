import { authFetch, LocalizedClientError } from "@/lib/client-api";
import { AZ_COPY, localizeApiError } from "@/lib/i18n";
import {
  getResponseErrorCode,
  parseListingCleanupResponse,
  parseListingUploadResponse,
  readResponseJson,
} from "@/lib/listing-authoring-responses";

export const MAX_LISTING_IMAGES = 5;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
export const LISTING_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateListingImageFiles(files: File[]) {
  if (files.length > MAX_LISTING_IMAGES)
    return AZ_COPY.listingForm.invalidImageCount;
  const invalid = files.find(
    (file) =>
      file.size > MAX_LISTING_IMAGE_BYTES ||
      !LISTING_IMAGE_TYPES.includes(
        file.type as (typeof LISTING_IMAGE_TYPES)[number],
      ),
  );
  return invalid ? AZ_COPY.listingForm.invalidImageFile : null;
}

export async function uploadListingImages(files: File[]) {
  try {
    const upload = new FormData();
    files.forEach((file) => upload.append("images", file));
    const response = await authFetch("/api/upload", {
      method: "POST",
      body: upload,
    });
    const body = await readResponseJson(response);
    if (!response.ok)
      throw new LocalizedClientError(
        localizeApiError(
          getResponseErrorCode(body),
          AZ_COPY.listingForm.uploadFailed,
        ),
      );
    const images = parseListingUploadResponse(body, files.length);
    if (!images)
      throw new LocalizedClientError(AZ_COPY.listingForm.uploadFailed);
    return images;
  } catch (error) {
    if (error instanceof LocalizedClientError) throw error;
    throw new LocalizedClientError(AZ_COPY.listingForm.uploadFailed);
  }
}

export async function cleanupUploadedListingImages(images: string[]) {
  if (!images.length) return { cleanupPending: false };
  try {
    const response = await authFetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
    const body = await readResponseJson(response);
    if (!response.ok)
      throw new LocalizedClientError(
        localizeApiError(
          getResponseErrorCode(body),
          AZ_COPY.listingForm.cleanupFailed,
        ),
      );
    const cleanup = parseListingCleanupResponse(body, images.length);
    if (!cleanup)
      throw new LocalizedClientError(AZ_COPY.listingForm.cleanupFailed);
    return cleanup;
  } catch (error) {
    if (error instanceof LocalizedClientError) throw error;
    throw new LocalizedClientError(AZ_COPY.listingForm.cleanupFailed);
  }
}
