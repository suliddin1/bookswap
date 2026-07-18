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
        "id,listing_id,buyer_id,seller_id,created_at,last_message_at, read_states:chat_room_reads(user_id,unread_count,last_read_at), listing:listings(id,seller_id,title,author,description,isbn,price,original_price,images,category,condition,city,status,created_at,seller:users!listings_seller_id_fkey(id,name,city,created_at)), buyer:users!chat_rooms_buyer_id_fkey(id,name,city,created_at), seller:users!chat_rooms_seller_id_fkey(id,name,city,created_at)",
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq("read_states.user_id", user.id)
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    return Response.json({
      data: (data ?? []).map((room) => {
        const readState = room.read_states?.find(
          (state: { user_id: string }) => state.user_id === user.id,
        );
        const { read_states: _readStates, ...safeRoom } = room;
        return {
          ...safeRoom,
          listing: normalizeListing(room.listing),
          currentUserId: user.id,
          unreadCount: Number(readState?.unread_count ?? 0),
          lastReadAt: readState?.last_read_at ?? null,
        };
      }),
    });
  } catch (error) {
    return apiError(error, 500);
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
      .select(
        "id,seller_id,status,seller:users!listings_seller_id_fkey(banned)",
      )
      .eq("id", input.listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (
      !listing ||
      listing.status !== "active" ||
      !listing.seller ||
      listing.seller.banned
    )
      throw new ApiError("Bu elan əlçatan deyil.", 404, "LISTING_UNAVAILABLE");
    if (listing.seller_id === user.id)
      throw new ApiError(
        "Öz elanın barədə özünə mesaj yaza bilməzsən.",
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
    return apiError(error, 500);
  }
}
