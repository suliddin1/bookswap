import { requireSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import { escapeHtml } from "@/lib/security";

export async function notifyUser(
  userId: string,
  type: "MESSAGE" | "SYSTEM",
  payload: Record<string, unknown>,
) {
  const supabase = requireSupabaseAdmin();
  const safePayload = JSON.parse(JSON.stringify(payload)) as Json;
  const { error: insertError } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, payload: safePayload });
  if (insertError) console.error("In-app notification failed", insertError);
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  if (user?.email) {
    const message = escapeHtml(
      String(
        payload.preview ??
          payload.message ??
          "There is an update on your BookSwap account.",
      ),
    );
    const { error } = await supabase.functions.invoke("notify", {
      body: {
        recipient: user.email,
        subject:
          type === "MESSAGE"
            ? "New BookSwap message"
            : "Your BookSwap listing was updated",
        html: `<p>${message}</p>`,
      },
    });
    if (error) console.error("Notification email delivery failed", error);
  }
}
