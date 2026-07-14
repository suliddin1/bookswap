import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api";
import type { Database } from "@/lib/database.types";

export async function markChatRoomRead(
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("chat_room_reads")
    .update({ unread_count: 0 })
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .select("room_id")
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new ApiError(
      "Conversation read state is unavailable.",
      404,
      "ROOM_NOT_FOUND",
    );
  return data;
}
