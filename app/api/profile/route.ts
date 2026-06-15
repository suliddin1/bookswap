import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const [{ data: profile, error }, { data: listings }, { count: favoriteCount }] = await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("listings").select("*, seller:users!listings_seller_id_fkey(*)").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    if (error) throw error;
    return Response.json({ data: { profile, listings: (listings ?? []).map(normalizeListing), favoriteCount: favoriteCount ?? 0 } });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const input = await request.json();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.from("users").update({
      name: input.name,
      phone: input.phone,
      city: input.city,
    }).eq("id", user.id).select().single();
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error, 401);
  }
}
