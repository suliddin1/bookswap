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
import { moderateText } from "@/lib/moderation";

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
      .single();
    if (error) return apiError(error, 404);
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
  try {
    assertRateLimit(request, "update-listing", 20, 60_000);
    const user = await requireUser(request);
    const { id } = await params;
    const input = listingUpdateInput.parse(await request.json());
    if (input.images) assertOwnedListingImages(input.images, user.id);
    if (input.title || input.description) {
      const check = await moderateText(
        `${input.title ?? ""}\n${input.description ?? ""}`,
      );
      if (!check.safe)
        throw new ApiError(check.reason, 422, "CONTENT_REJECTED");
    }
    const supabase = requireSupabaseAdmin();
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
    return Response.json({ data: normalizeListing(data) });
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { data: listing } = await supabase
      .from("listings")
      .select("images")
      .eq("id", id)
      .eq("seller_id", user.id)
      .maybeSingle();
    if (!listing)
      throw new ApiError(
        "Listing not found or not owned by you",
        404,
        "LISTING_NOT_FOUND",
      );
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id);
    if (error) throw error;
    const paths = (listing.images ?? []).flatMap((value: string) => {
      try {
        const marker = "/storage/v1/object/public/listing-images/";
        const index = new URL(value).pathname.indexOf(marker);
        return index >= 0
          ? [
              decodeURIComponent(
                new URL(value).pathname.slice(index + marker.length),
              ),
            ]
          : [];
      } catch {
        return [];
      }
    });
    if (paths.length)
      await supabase.storage.from("listing-images").remove(paths);
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
