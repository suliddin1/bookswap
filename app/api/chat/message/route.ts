import { ApiError, apiError, messageInput } from "@/lib/api";
import { randomUUID } from "node:crypto";
import {
  assertModerationApproved,
  moderateAndRecordText,
} from "@/lib/moderation";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = messageInput.parse(await request.json());
    await assertRateLimit(request, "send-message", {
      actorId: user.id,
      resourceId: input.roomId,
      limit: 30,
      windowMs: 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("buyer_id,seller_id")
      .eq("id", input.roomId)
      .maybeSingle();
    if (roomError) throw roomError;
    if (!room || ![room.buyer_id, room.seller_id].includes(user.id))
      throw new ApiError(
        "Bu söhbətə baxmaq icazən yoxdur.",
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
    return apiError(error, 500, request);
  }
}
