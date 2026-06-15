import { z } from "zod";

export const listingInput = z.object({
  title: z.string().min(2).max(140),
  author: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  isbn: z.string().max(20).optional(),
  price: z.number().positive().max(10000),
  category: z.string().min(2),
  city: z.string().min(2),
  condition: z.enum(["Like new", "Very good", "Good", "Well read"]),
  images: z.array(z.string().url()).max(5).default([]),
});

export const messageInput = z.object({
  roomId: z.string().min(1),
  text: z.string().min(1).max(2000),
});

export const reviewInput = z.object({
  listingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

export function apiError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  return Response.json({ error: message }, { status });
}
