import { apiError, profileInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const [profileResult, listingsResult, favoritesResult] = await Promise.all([
      supabase
        .from("users")
        .select("name,phone,city")
        .eq("id", user.id)
        .single(),
      supabase
        .from("listings")
        .select(
          "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (listingsResult.error) throw listingsResult.error;
    if (favoritesResult.error) throw favoritesResult.error;
    return Response.json({
      data: {
        profile: profileResult.data,
        listings: (listingsResult.data ?? []).map(normalizeListing),
        favoriteCount: favoritesResult.count ?? 0,
      },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const input = profileInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .update({
        name: input.name,
        phone: input.phone,
        city: input.city,
      })
      .eq("id", user.id)
      .select("name,phone,city")
      .single();
    if (error) throw error;
    return Response.json({ requesterId: user.id, data });
  } catch (error) {
    return apiError(error, 500);
  }
}
