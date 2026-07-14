import { apiError, assertRateLimit, privacyRequestInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("privacy_requests")
      .select("id,type,status,created_at,resolved_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return Response.json({ data: data ?? [] });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "privacy-request", 5, 60 * 60_000);
    const user = await requireUser(request);
    const input = privacyRequestInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({ user_id: user.id, ...input })
      .select("id,type,status,created_at")
      .single();
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error, 500);
  }
}
