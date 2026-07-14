import { ApiError, apiError, assertRateLimit, messageInput } from "@/lib/api";
import { randomUUID } from "node:crypto";
import {
  assertModerationApproved,
  moderateAndRecordText,
} from "@/lib/moderation";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "send-message", 30, 60_000);
    const input = messageInput.parse(await request.json());
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("buyer_id,seller_id")
      .eq("id", input.roomId)
      .single();
    if (!room || ![room.buyer_id, room.seller_id].includes(user.id))
      throw new ApiError(
        "You are not a member of this conversation",
        403,
        "ROOM_FORBIDDEN",
      );
    const check = await moderateAndRecordText(supabase, input.text, {
      actorId: user.id,
      requestId: randomUUID(),
      surface: "chat_message",
      targetId: input.roomId,
    });
    assertModerationApproved(check);
    const { data, error } = await supabase
      .from("messages")
      .insert({ room_id: input.roomId, sender_id: user.id, text: input.text })
      .select()
      .single();
    if (error) throw error;
    return Response.json(
      { data, notificationDelivered: true },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, 500);
  }
}
