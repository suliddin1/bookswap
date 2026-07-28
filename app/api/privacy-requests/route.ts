import { ApiError, apiError, privacyRequestInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
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
    return apiError(error, 500, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = privacyRequestInput.parse(await request.json());
    await assertRateLimit(request, "privacy-request", {
      actorId: user.id,
      resourceId: input.type,
      limit: 5,
      windowMs: 60 * 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({ user_id: user.id, ...input })
      .select("id,type,status,created_at")
      .single();
    if (error?.code === "23505")
      throw new ApiError(
        "Bu növ üzrə artıq açıq məxfilik müraciətin var.",
        409,
        "PRIVACY_REQUEST_EXISTS",
      );
    if (error) throw error;
    return Response.json({ requesterId: user.id, data }, { status: 201 });
  } catch (error) {
    return apiError(error, 500, request);
  }
}
