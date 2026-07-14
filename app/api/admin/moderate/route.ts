import { adminModerationInput, apiError } from "@/lib/api";
import { throwAdminActionError } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { sendOptionalNotificationEmail } from "@/lib/notify";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const { listingId, action, reason } = adminModerationInput.parse(
      await request.json(),
    );
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.rpc("admin_moderate_listing", {
      p_actor_id: admin.id,
      p_listing_id: listingId,
      p_action: action,
      p_reason: reason,
    });
    throwAdminActionError(error);
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      typeof data.sellerId !== "string" ||
      typeof data.notificationId !== "string"
    )
      throw new Error("Invalid admin moderation result");
    const emailDelivery = await sendOptionalNotificationEmail(
      data.sellerId,
      "SYSTEM",
      {
        listingId,
        message: `Your listing was ${action === "approve" ? "approved" : "rejected"}.`,
      },
    );
    return Response.json({
      data,
      notificationDelivery: {
        notificationId: data.notificationId,
        ...emailDelivery,
      },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
