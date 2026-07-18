import { ApiError, apiError, resourceId } from "@/lib/api";
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
    const id = resourceId.parse((await params).id);
    const supabase = requireSupabaseAdmin();
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select(
        "id,listing_id,buyer_id,seller_id,created_at,last_message_at, listing:listings(id,seller_id,title,author,description,isbn,price,original_price,images,category,condition,city,status,created_at,seller:users!listings_seller_id_fkey(id,name,city,created_at)), buyer:users!chat_rooms_buyer_id_fkey(id,name,city,created_at), seller:users!chat_rooms_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("id", id)
      .maybeSingle();
    if (roomError) throw roomError;
    if (!room || ![room.buyer_id, room.seller_id].includes(user.id))
      throw new ApiError("Söhbət tapılmadı.", 404, "ROOM_NOT_FOUND");
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id,room_id,sender_id,text,created_at")
      .eq("room_id", id)
      .order("created_at")
      .order("id");
    if (messagesError) throw messagesError;
    const { data: readState, error: readStateError } = await supabase
      .from("chat_room_reads")
      .select("unread_count,last_read_at")
      .eq("room_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readStateError) throw readStateError;
    return Response.json({
      data: {
        ...room,
        listing: normalizeListing(room.listing),
        messages: messages ?? [],
        currentUserId: user.id,
        unreadCount: Number(readState?.unread_count ?? 0),
        lastReadAt: readState?.last_read_at ?? null,
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
    const id = resourceId.parse((await params).id);
    const supabase = requireSupabaseAdmin();
    await markChatRoomRead(supabase, id, user.id);
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error, 500);
  }
}
