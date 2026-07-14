import { ApiError, apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { markChatRoomRead } from "@/lib/chat";
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
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select(
        "*, listing:listings(*, seller:users!listings_seller_id_fkey(id,name,city,created_at)), buyer:users!chat_rooms_buyer_id_fkey(id,name,city,created_at), seller:users!chat_rooms_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("id", id)
      .maybeSingle();
    if (
      roomError ||
      !room ||
      ![room.buyer_id, room.seller_id].includes(user.id)
    )
      throw new ApiError("Conversation not found.", 404, "ROOM_NOT_FOUND");
    await markChatRoomRead(supabase, id, user.id);
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", id)
      .order("created_at")
      .order("id");
    if (messagesError) throw messagesError;
    return Response.json({
      data: {
        ...room,
        listing: normalizeListing(room.listing),
        messages: messages ?? [],
        currentUserId: user.id,
        unreadCount: 0,
      },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    await markChatRoomRead(supabase, id, user.id);
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error, 500);
  }
}
