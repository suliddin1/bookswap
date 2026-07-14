import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = requireSupabaseAdmin();
    const [
      { data: listings },
      { data: users },
      { data: reports },
      { data: privacyRequests },
      { data: moderationDecisions, error: moderationError },
    ] = await Promise.all([
      supabase
        .from("listings")
        .select("*, seller:users!listings_seller_id_fkey(*)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("users")
        .select("id,name,email,city,banned,is_admin,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("reports")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("privacy_requests")
        .select("id,user_id,type,details,status,created_at")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: true }),
      supabase
        .from("moderation_decisions")
        .select(
          "id,request_id,surface,target_id,content_type,provider,outcome,reason_code,categories,created_at,actor:users!moderation_decisions_actor_id_fkey(id,name)",
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (moderationError) throw moderationError;
    return Response.json({
      data: {
        listings: (listings ?? []).map(normalizeListing),
        users: users ?? [],
        reports: reports ?? [],
        privacyRequests: privacyRequests ?? [],
        moderationDecisions: moderationDecisions ?? [],
      },
    });
  } catch (error) {
    return apiError(error, 403);
  }
}
