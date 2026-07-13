import { z } from "zod";
import { AZERBAIJAN_CITIES, BOOK_CATEGORIES, BOOK_CONDITIONS } from "./marketplace";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const uuid = z.string().uuid();

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
    images: z.array(z.string().url()).min(1).max(5),
  })
  .strict();

export const listingUpdateInput = listingInput
  .partial()
  .extend({
    status: z.enum(["active", "sold"]).optional(),
  })
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
export const moderationInput = z
  .object({
    text: z.string().max(4000).optional(),
    imageUrl: z.string().url().optional(),
  })
  .strict()
  .refine((value) => value.text || value.imageUrl, "Text or image is required");
export const adminModerationInput = z
  .object({
    listingId: uuid,
    action: z.enum(["approve", "reject"]),
  })
  .strict();
export const adminBanInput = z
  .object({ userId: uuid, banned: z.boolean() })
  .strict();
export const adminReportInput = z
  .object({
    reportId: uuid,
    status: z.enum(["resolved", "dismissed"]),
  })
  .strict();
export const privacyRequestInput = z
  .object({
    type: z.enum([
      "access",
      "correction",
      "export",
      "deletion",
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
  })
  .strict();

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

export function assertRateLimit(
  request: Request,
  scope: string,
  limit = 30,
  windowMs = 60_000,
) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = `${scope}:${client}`;
  const now = Date.now();
  if (rateBuckets.size > 5_000) {
    rateBuckets.forEach((bucket, bucketKey) => {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    });
  }
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit)
    throw new ApiError(
      "Too many requests. Please try again shortly.",
      429,
      "RATE_LIMITED",
    );
  current.count += 1;
}

export function apiError(error: unknown, status = 400) {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: "Invalid request data.",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  const message =
    status < 500 && error instanceof Error
      ? error.message
      : "Something went wrong";
  if (status >= 500) console.error("BookSwap API error", error);
  return Response.json(
    { error: message, code: status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST" },
    { status },
  );
}
