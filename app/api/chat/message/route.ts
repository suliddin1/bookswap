import { apiError, messageInput } from "@/lib/api";
import { moderateText } from "@/lib/moderation";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function POST(request: Request) {
  try {
    const input = messageInput.parse(await request.json());
    const check = await moderateText(input.text);
    if (!check.safe) return apiError(new Error(check.reason), 422);
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const { data: room } = await supabase.from("chat_rooms").select("buyer_id,seller_id").eq("id", input.roomId).single();
    if (!room || ![room.buyer_id, room.seller_id].includes(user.id)) throw new Error("You are not a member of this conversation");
    const { data, error } = await supabase.from("messages").insert({ room_id: input.roomId, sender_id: user.id, text: input.text }).select().single();
    if (error) throw error;
    await supabase.channel(`room:${input.roomId}`).send({ type: "broadcast", event: "message", payload: data });
    const recipientId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
    await notifyUser(recipientId, "MESSAGE", { roomId: input.roomId, preview: input.text.slice(0, 120) });
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
