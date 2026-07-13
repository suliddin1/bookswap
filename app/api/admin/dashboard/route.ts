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
    ]);
    return Response.json({
      data: {
        listings: (listings ?? []).map(normalizeListing),
        users: users ?? [],
        reports: reports ?? [],
        privacyRequests: privacyRequests ?? [],
      },
    });
  } catch (error) {
    return apiError(error, 403);
  }
}
