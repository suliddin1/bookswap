import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    await assertRateLimit(request, "admin:dashboard", {
      actorId: admin.id,
      limit: 60,
      windowMs: 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const [
      { data: listings, error: listingsError },
      { data: users, error: usersError },
      { data: reports, error: reportsError },
      { data: privacyRequests, error: privacyRequestsError },
      { data: moderationDecisions, error: moderationError },
      { data: auditLog, error: auditError },
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
      supabase
        .from("admin_audit_log")
        .select(
          "id,actor_id,actor_name,target_type,target_id,action,reason,before_state,after_state,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const dashboardError = [
      listingsError,
      usersError,
      reportsError,
      privacyRequestsError,
      moderationError,
      auditError,
    ].find(Boolean);
    if (dashboardError) throw dashboardError;
    return Response.json({
      data: {
        listings: (listings ?? []).map(normalizeListing),
        users: users ?? [],
        reports: reports ?? [],
        privacyRequests: privacyRequests ?? [],
        moderationDecisions: moderationDecisions ?? [],
        auditLog: auditLog ?? [],
      },
    });
  } catch (error) {
    return apiError(error, 500, request);
  }
}
