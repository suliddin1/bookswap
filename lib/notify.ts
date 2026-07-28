import { requireSupabaseAdmin } from "./supabase";
import type { Json } from "./database.types";
import { escapeHtml } from "./security";
import { AZ_COPY, formatNotificationPresentation } from "./i18n";
import { logServerError } from "./server-log";

type NotificationType = "MESSAGE" | "SYSTEM";

export function formatNotificationEmail(
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  const presentation = formatNotificationPresentation(type, payload);
  return {
    subject:
      type === "MESSAGE"
        ? AZ_COPY.notifications.emailMessageSubject
        : AZ_COPY.notifications.emailSystemSubject,
    html: `<div lang="az"><p>${escapeHtml(presentation.body)}</p></div>`,
  };
}

export async function notifyUser(
  userId: string,
  type: NotificationType,
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
  return {
    notificationId: notification.id,
    ...(await sendOptionalNotificationEmail(userId, type, payload)),
  };
}

export async function sendOptionalNotificationEmail(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  const supabase = requireSupabaseAdmin();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  if (userError) {
    logServerError("notification.recipient_lookup_failed", userError);
    return {
      emailAttempted: false,
      emailDelivered: false,
    };
  }
  if (user?.email) {
    const email = formatNotificationEmail(type, payload);
    const { error } = await supabase.functions.invoke("notify", {
      body: {
        recipient: user.email,
        ...email,
      },
    });
    if (error) logServerError("notification.email_delivery_failed", error);
    return {
      emailAttempted: true,
      emailDelivered: !error,
    };
  }
  return {
    emailAttempted: false,
    emailDelivered: false,
  };
}
