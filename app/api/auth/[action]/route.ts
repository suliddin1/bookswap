import { ApiError, apiError, assertRateLimit } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const credentials = z
  .object({ email: z.string().email(), password: z.string().min(8).max(128) })
  .strict();
const emailOnly = z.object({ email: z.string().email() }).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertRateLimit(request, "auth", 10, 60_000);
    const { action } = await params;
    const supabase = getSupabaseClient();
    if (!supabase)
      return apiError(new Error("Supabase is not configured."), 503);
    const body = await request.json();
    if (action === "signup")
      return Response.json(await supabase.auth.signUp(credentials.parse(body)));
    if (action === "login")
      return Response.json(
        await supabase.auth.signInWithPassword(credentials.parse(body)),
      );
    if (action === "magic-link")
      return Response.json(
        await supabase.auth.signInWithOtp(emailOnly.parse(body)),
      );
    if (action === "reset")
      return Response.json(
        await supabase.auth.resetPasswordForEmail(emailOnly.parse(body).email),
      );
    throw new ApiError("Unknown auth action", 404, "AUTH_ACTION_NOT_FOUND");
  } catch (error) {
    return apiError(error);
  }
}
