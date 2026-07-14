import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { assertOwnedListingImages } from "@/lib/security";
import {
  ApiError,
  apiError,
  assertRateLimit,
  listingUpdateInput,
} from "@/lib/api";
import { normalizeListing } from "@/lib/listings";
import { requireUser } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import {
  assertModerationApproved,
  moderateAndRecordImage,
  moderateAndRecordText,
} from "@/lib/moderation";
import {
  drainListingImageCleanupJobs,
  queueListingImageCleanup,
} from "@/lib/listing-images";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at), reviews(*, author:users!reviews_author_id_fkey(id,name,city,created_at))",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new ApiError("Listing not found", 404, "LISTING_NOT_FOUND");
    return Response.json({
      data: { ...normalizeListing(data), reviews: data.reviews ?? [] },
    });
  } catch (error) {
    return apiError(error, 503);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let ownerId = "";
  let submittedImages: string[] = [];
  let supabase: ReturnType<typeof requireSupabaseAdmin> | null = null;
  try {
    assertRateLimit(request, "update-listing", 20, 60_000);
    const user = await requireUser(request);
    ownerId = user.id;
    const { id } = await params;
    const input = listingUpdateInput.parse(await request.json());
    if (input.images) {
      submittedImages = input.images;
      assertOwnedListingImages(input.images, user.id);
    }
    supabase = requireSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("listings")
      .select("id,title,description,images")
      .eq("id", id)
      .eq("seller_id", user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing)
      throw new ApiError(
        "Listing not found or not owned by you",
        404,
        "LISTING_NOT_FOUND",
      );

    const requestId = randomUUID();
    const checks = [];
    if (input.title !== undefined || input.description !== undefined) {
      checks.push(
        moderateAndRecordText(
          supabase,
          `${input.title ?? existing.title}\n${input.description ?? existing.description}`,
          {
            actorId: user.id,
            requestId,
            surface: "listing_update",
            targetId: id,
          },
        ),
      );
    }
    const existingImages = new Set(existing.images);
    for (const imageUrl of input.images?.filter(
      (image) => !existingImages.has(image),
    ) ?? []) {
      checks.push(
        moderateAndRecordImage(supabase, imageUrl, {
          actorId: user.id,
          requestId,
          surface: "listing_update",
          targetId: id,
        }),
      );
    }
    (await Promise.all(checks)).forEach(assertModerationApproved);
    await drainListingImageCleanupJobs(supabase, user.id);
    const updates = {
      title: input.title,
      author: input.author,
      description: input.description,
      isbn: input.isbn,
      price: input.price,
      images: input.images,
      category: input.category,
      condition: input.condition,
      city: input.city,
      status: input.status,
    };
    const { data, error } = await supabase
      .from("listings")
      .update(updates)
      .eq("id", id)
      .eq("seller_id", user.id)
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
      )
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new ApiError(
        "Listing not found or not owned by you",
        404,
        "LISTING_NOT_FOUND",
      );
    const cleanup = await drainListingImageCleanupJobs(supabase, user.id, id);
    return Response.json({
      data: normalizeListing(data),
      imageCleanupPending: cleanup.pending > 0,
    });
  } catch (error) {
    if (supabase && ownerId && submittedImages.length) {
      try {
        await queueListingImageCleanup(supabase, ownerId, submittedImages);
        await drainListingImageCleanupJobs(supabase, ownerId);
      } catch (cleanupError) {
        console.error(
          "Could not compensate failed listing update",
          cleanupError,
        );
      }
    }
    return apiError(error, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRateLimit(request, "delete-listing", 10, 60_000);
    const user = await requireUser(request);
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    await drainListingImageCleanupJobs(supabase, user.id);
    const { data: deleted, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!deleted)
      throw new ApiError(
        "Listing not found or not owned by you",
        404,
        "LISTING_NOT_FOUND",
      );
    const cleanup = await drainListingImageCleanupJobs(supabase, user.id, id);
    return Response.json({
      deleted: true,
      imageCleanupPending: cleanup.pending > 0,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
