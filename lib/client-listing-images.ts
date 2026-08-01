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

export function validateListingImageFiles(files: readonly File[]) {
  if (files.length > MAX_LISTING_IMAGES)
    return AZ_COPY.listingForm.invalidImageCount;
  const unsupported = files.find(
    (file) =>
      !LISTING_IMAGE_TYPES.includes(
        file.type.toLowerCase() as (typeof LISTING_IMAGE_TYPES)[number],
      ),
  );
  if (unsupported) return AZ_COPY.listingForm.unsupportedImageFormat;
  if (files.some((file) => file.size > MAX_LISTING_IMAGE_BYTES))
    return AZ_COPY.listingForm.imageTooLarge;
  if (files.some((file) => file.size < 1))
    return AZ_COPY.listingForm.invalidImageContent;
  return null;
}

export function createListingImagePreviewUrls(files: readonly File[]): {
  urls: string[];
  error: string | null;
} {
  if (!files.length) return { urls: [], error: null };
  const objectUrl = globalThis.URL?.createObjectURL;
  if (typeof objectUrl !== "function")
    return { urls: [], error: AZ_COPY.listingForm.previewUnavailable };

  const urls: string[] = [];
  try {
    for (const file of files) urls.push(objectUrl.call(globalThis.URL, file));
    return { urls, error: null };
  } catch {
    revokeListingImagePreviewUrls(urls);
    return { urls: [], error: AZ_COPY.listingForm.previewUnavailable };
  }
}

export function revokeListingImagePreviewUrls(urls: readonly string[]) {
  const revokeObjectUrl = globalThis.URL?.revokeObjectURL;
  if (typeof revokeObjectUrl !== "function") return;
  for (const url of urls) {
    try {
      revokeObjectUrl.call(globalThis.URL, url);
    } catch {
      // Object URL cleanup is best-effort and must never terminate authoring.
    }
  }
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
