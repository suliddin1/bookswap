import { apiError } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await params;
    const supabase = getSupabaseClient();
    if (!supabase) return apiError(new Error("Supabase is not configured."), 503);
    const body = await request.json();
    if (action === "signup") return Response.json(await supabase.auth.signUp({ email: body.email, password: body.password }));
    if (action === "login") return Response.json(await supabase.auth.signInWithPassword({ email: body.email, password: body.password }));
    if (action === "magic-link") return Response.json(await supabase.auth.signInWithOtp({ email: body.email }));
    if (action === "reset") return Response.json(await supabase.auth.resetPasswordForEmail(body.email));
    return apiError(new Error("Unknown auth action"), 404);
  } catch (error) {
    return apiError(error);
  }
}
