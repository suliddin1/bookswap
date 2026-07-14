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
  const { data: notification, error: insertError } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, payload: safePayload })
    .select("id")
    .single();
  if (insertError) throw insertError;
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  if (userError) {
    console.error("Notification email recipient lookup failed", userError);
    return {
      notificationId: notification.id,
      emailAttempted: false,
      emailDelivered: false,
    };
  }
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
    return {
      notificationId: notification.id,
      emailAttempted: true,
      emailDelivered: !error,
    };
  }
  return {
    notificationId: notification.id,
    emailAttempted: false,
    emailDelivered: false,
  };
}
