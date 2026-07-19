import { z } from "zod";
import type { Listing } from "./types";

const listingStatuses = ["draft", "active", "sold", "locked"] as const;

const listingSchema = z.custom<Listing>(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const listing = value as Record<string, unknown>;
    const seller = listing.seller;
    return (
      typeof listing.id === "string" &&
      typeof listing.title === "string" &&
      typeof listing.author === "string" &&
      typeof listing.description === "string" &&
      typeof listing.price === "number" &&
      typeof listing.category === "string" &&
      typeof listing.condition === "string" &&
      typeof listing.city === "string" &&
      typeof listing.status === "string" &&
      listingStatuses.includes(
        listing.status as (typeof listingStatuses)[number],
      ) &&
      !!seller &&
      typeof seller === "object" &&
      !Array.isArray(seller) &&
      typeof (seller as Record<string, unknown>).id === "string" &&
      typeof (seller as Record<string, unknown>).name === "string"
    );
  },
  { message: "Invalid administrator listing response" },
);

const userSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    city: z.string().nullable(),
    banned: z.boolean(),
    is_admin: z.boolean(),
    created_at: z.string(),
  })
  .passthrough();

const reportSchema = z
  .object({
    id: z.string().uuid(),
    listing_id: z.string().uuid().nullable(),
    reason: z.string(),
  })
  .passthrough();

const privacyRequestSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: z.string(),
    details: z.string(),
    status: z.string(),
    created_at: z.string(),
  })
  .passthrough();

const moderationDecisionSchema = z
  .object({
    id: z.string().uuid(),
    surface: z.string(),
    target_id: z.string().nullable(),
    content_type: z.string(),
    provider: z.string(),
    outcome: z.string(),
    reason_code: z.string(),
    categories: z.array(z.string()),
    created_at: z.string(),
    actor: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
  })
  .passthrough();

const auditEntrySchema = z
  .object({
    id: z.string().uuid(),
    actor_id: z.string().uuid(),
    actor_name: z.string(),
    target_type: z.string(),
    target_id: z.string().uuid(),
    action: z.string(),
    reason: z.string(),
    before_state: z.unknown(),
    after_state: z.unknown(),
    created_at: z.string(),
  })
  .passthrough();

const adminDashboardResponseSchema = z.object({
  data: z.object({
    listings: z.array(listingSchema),
    users: z.array(userSchema),
    reports: z.array(reportSchema),
    privacyRequests: z.array(privacyRequestSchema),
    moderationDecisions: z.array(moderationDecisionSchema),
    auditLog: z.array(auditEntrySchema),
  }),
});

export type AdminDashboardData = z.infer<
  typeof adminDashboardResponseSchema
>["data"];

export function parseAdminDashboardResponse(value: unknown) {
  return adminDashboardResponseSchema.parse(value).data;
}
