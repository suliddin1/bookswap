import { z } from "zod";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "./marketplace";
import { AZ_COPY, localizeApiError } from "./i18n";
import { logServerError, requestId } from "./server-log";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const resourceId = z.string().uuid();
const uuid = resourceId;
const listingImages = z
  .array(z.string().url())
  .min(1)
  .max(5)
  .refine(
    (images) => new Set(images).size === images.length,
    AZ_COPY.api.uniqueImages,
  );

export const listingInput = z
  .object({
    title: z.string().trim().min(2).max(140),
    author: z.string().trim().min(2).max(100),
    description: z.string().trim().min(10).max(2000),
    isbn: z.string().trim().max(20).optional(),
    price: z.number().positive().max(10000),
    category: z.enum(BOOK_CATEGORIES),
    city: z.enum(AZERBAIJAN_CITIES),
    condition: z.enum(BOOK_CONDITIONS),
    images: listingImages,
  })
  .strict();

export const listingUpdateInput = listingInput
  .partial()
  .extend({
    status: z.enum(["active", "sold"]).optional(),
  })
  .strict();

export const listingImageCleanupInput = z
  .object({ images: listingImages })
  .strict();

export const messageInput = z
  .object({
    roomId: uuid,
    text: z.string().trim().min(1).max(2000),
  })
  .strict();

export const reviewInput = z
  .object({
    listingId: uuid,
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(3).max(1000),
  })
  .strict();

export const favoriteInput = z.object({ listingId: uuid }).strict();
export const roomInput = z.object({ listingId: uuid }).strict();
export const reportInput = z
  .object({
    listingId: uuid,
    reason: z.string().trim().min(10).max(500),
  })
  .strict();
export const profileInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(30).nullable().optional(),
    city: z.string().trim().min(2).max(80),
  })
  .strict();
const adminActionReason = z.string().trim().min(10).max(1000);
export const adminModerationInput = z
  .object({
    listingId: uuid,
    action: z.enum(["approve", "reject"]),
    reason: adminActionReason,
  })
  .strict();
export const adminBanInput = z
  .object({ userId: uuid, banned: z.boolean(), reason: adminActionReason })
  .strict();
export const adminReportInput = z
  .object({
    reportId: uuid,
    status: z.enum(["resolved", "dismissed"]),
    reason: adminActionReason,
  })
  .strict();
export const privacyRequestInput = z
  .object({
    type: z.enum([
      "access",
      "correction",
      "export",
      "deletion",
      "consent_withdrawal",
      "objection",
      "appeal",
    ]),
    details: z.string().trim().min(10).max(2000),
  })
  .strict();
export const adminPrivacyRequestInput = z
  .object({
    requestId: uuid,
    status: z.enum(["in_progress", "completed", "rejected"]),
    reason: adminActionReason,
  })
  .strict();

export function apiError(error: unknown, status = 400, request?: Request) {
  const correlationId = requestId(request);
  if (error instanceof z.ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const details = Object.fromEntries(
      Object.keys(fieldErrors).map((field) => [
        field,
        [AZ_COPY.api.invalidField],
      ]),
    );
    return Response.json(
      {
        error: AZ_COPY.api.invalidData,
        code: "VALIDATION_ERROR",
        details,
      },
      { status: 422, headers: { "X-Request-ID": correlationId } },
    );
  }
  if (error instanceof ApiError) {
    const fallback =
      error.status >= 500 ? AZ_COPY.api.internalError : AZ_COPY.api.badRequest;
    if (error.status >= 500) {
      logServerError("api.request_failed", error, {
        requestId: correlationId,
        method: request?.method,
        path: request ? new URL(request.url).pathname : undefined,
        status: error.status,
        code: error.code,
      });
    }
    const headers: Record<string, string> = {
      "X-Request-ID": correlationId,
    };
    if (error.retryAfterSeconds) {
      headers["Retry-After"] = String(error.retryAfterSeconds);
    }
    return Response.json(
      { error: localizeApiError(error.code, fallback), code: error.code },
      { status: error.status, headers },
    );
  }
  if (status >= 500) {
    logServerError("api.unexpected_failure", error, {
      requestId: correlationId,
      method: request?.method,
      path: request ? new URL(request.url).pathname : undefined,
      status,
    });
  }
  return Response.json(
    {
      error: status >= 500 ? AZ_COPY.api.internalError : AZ_COPY.api.badRequest,
      code: status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
    },
    { status, headers: { "X-Request-ID": correlationId } },
  );
}
