import { ApiError, apiError, favoriteInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import {
  FAVORITE_VISIBLE_STATUSES,
  isFavoriteListingVisible,
} from "@/lib/favorites";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

function listingUnavailable() {
  return new ApiError(
    "This listing is not available to save",
    404,
    "LISTING_UNAVAILABLE",
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const listingId = new URL(request.url).searchParams.get("listingId");
    if (listingId) {
      const input = favoriteInput.parse({ listingId });
      const { data, error } = await supabase
        .from("favorites")
        .select(
          "listing:listings!favorites_listing_id_fkey!inner(status,seller:users!listings_seller_id_fkey!inner(banned))",
        )
        .eq("user_id", user.id)
        .eq("listing_id", input.listingId)
        .in("listing.status", [...FAVORITE_VISIBLE_STATUSES])
        .eq("listing.seller.banned", false)
        .maybeSingle();
      if (error) throw error;
      return Response.json({
        data: { saved: isFavoriteListingVisible(data?.listing) },
      });
    }
    const { data, error } = await supabase
      .from("favorites")
      .select(
        "listing:listings!favorites_listing_id_fkey!inner(*, seller:users!listings_seller_id_fkey!inner(id,name,city,created_at,banned))",
      )
      .eq("user_id", user.id)
      .in("listing.status", [...FAVORITE_VISIBLE_STATUSES])
      .eq("listing.seller.banned", false);
    if (error) throw error;
    return Response.json({
      data: (data ?? []).flatMap((item: any) =>
        isFavoriteListingVisible(item.listing)
          ? [normalizeListing(item.listing)]
          : [],
      ),
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { listingId } = favoriteInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(
        "status,seller:users!listings_seller_id_fkey!inner(banned)",
      )
      .eq("id", listingId)
      .in("status", [...FAVORITE_VISIBLE_STATUSES])
      .eq("seller.banned", false)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!isFavoriteListingVisible(listing)) throw listingUnavailable();
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: user.id, listing_id: listingId });
    if (error?.code === "23514") throw listingUnavailable();
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const { listingId } = favoriteInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
    if (error) throw error;
    return Response.json({ saved: false });
  } catch (error) {
    return apiError(error, 500);
  }
}
