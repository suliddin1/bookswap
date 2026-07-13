import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { data: room, error } = await supabase
      .from("chat_rooms")
      .select(
        "*, listing:listings(*, seller:users!listings_seller_id_fkey(id,name,city,created_at)), buyer:users!chat_rooms_buyer_id_fkey(id,name,city,created_at), seller:users!chat_rooms_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("id", id)
      .single();
    if (error || !room || ![room.buyer_id, room.seller_id].includes(user.id))
      throw new Error("Conversation not found.");
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", id)
      .order("created_at");
    return Response.json({
      data: {
        ...room,
        listing: normalizeListing(room.listing),
        messages: messages ?? [],
        currentUserId: user.id,
      },
    });
  } catch (error) {
    return apiError(error, 404);
  }
}
