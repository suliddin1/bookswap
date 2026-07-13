import { requireSupabaseAdmin } from "@/lib/supabase";
import { ApiError, apiError, assertRateLimit, roomInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(
        "*, listing:listings(*, seller:users!listings_seller_id_fkey(id,name,city,created_at)), buyer:users!chat_rooms_buyer_id_fkey(id,name,city,created_at), seller:users!chat_rooms_seller_id_fkey(id,name,city,created_at)",
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({
      data: (data ?? []).map((room: any) => ({
        ...room,
        listing: normalizeListing(room.listing),
        currentUserId: user.id,
      })),
    });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "open-room", 20, 60_000);
    const input = roomInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id,status")
      .eq("id", input.listingId)
      .single();
    if (listingError || !listing || listing.status !== "active")
      throw new ApiError(
        "This listing is not available",
        404,
        "LISTING_UNAVAILABLE",
      );
    if (listing.seller_id === user.id)
      throw new ApiError(
        "You cannot message yourself about your own listing",
        409,
        "OWN_LISTING",
      );
    const room = {
      listing_id: input.listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    };
    const { data, error } = await supabase
      .from("chat_rooms")
      .upsert(room, { onConflict: "listing_id,buyer_id" })
      .select()
      .single();
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
