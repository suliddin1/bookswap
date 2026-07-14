import { ApiError, apiError } from "@/lib/api";
import { normalizeListing } from "@/lib/listings";
import {
  createListingCursorScope,
  decodeListingCursor,
  encodeListingCursor,
  getListingCursorFilter,
  parseListingLimit,
  parsePublicUuid,
} from "@/lib/listing-pagination";
import { requireSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parsePublicUuid(rawId);
    const { searchParams } = new URL(request.url);
    const limit = parseListingLimit(searchParams.get("limit"), 12);
    const scope = createListingCursorScope({ sellerId: id, type: "seller" });
    const cursor = decodeListingCursor(
      searchParams.get("cursor"),
      "newest",
      scope,
    );
    const supabase = requireSupabaseClient();
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("id,name,city,created_at")
      .eq("id", id)
      .maybeSingle();
    if (sellerError) throw sellerError;
    if (!seller)
      throw new ApiError("Seller not found.", 404, "SELLER_NOT_FOUND");

    let listingsQuery = supabase
      .from("listings")
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("seller_id", id)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (cursor)
      listingsQuery = listingsQuery.or(getListingCursorFilter(cursor));

    const [
      { data: rows, error: listingsError },
      { data: reviews, error: reviewsError },
    ] = await Promise.all([
      listingsQuery,
      supabase
        .from("reviews")
        .select("rating, listing:listings!inner(seller_id,status)")
        .eq("listing.seller_id", id)
        .eq("listing.status", "sold"),
    ]);
    if (listingsError) throw listingsError;
    if (reviewsError) throw reviewsError;

    const pageRows = (rows ?? []).slice(0, limit);
    const last = pageRows.at(-1);
    const ratings = (reviews ?? []).map((review) => Number(review.rating));
    const rating = ratings.length
      ? Number(
          (
            ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          ).toFixed(1),
        )
      : null;
    const initials = seller.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return Response.json({
      data: {
        seller: {
          id: seller.id,
          name: seller.name,
          city: seller.city,
          createdAt: seller.created_at,
          initials,
          rating,
          reviewCount: ratings.length,
        },
        items: pageRows.map(normalizeListing),
        nextCursor:
          (rows ?? []).length > limit && last
            ? encodeListingCursor(last, "newest", scope)
            : null,
      },
    });
  } catch (error) {
    return apiError(error, 503);
  }
}
