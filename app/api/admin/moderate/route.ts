import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { listingId, action } = await request.json();
    if (!["approve", "reject"].includes(action)) throw new Error("Unknown moderation action");
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .update({ status: action === "approve" ? "active" : "draft" })
      .eq("id", listingId)
      .select("seller_id")
      .single();
    if (error) throw error;
    await notifyUser(data.seller_id, "SYSTEM", { listingId, message: `Your listing was ${action}d.` });
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 403);
  }
}
