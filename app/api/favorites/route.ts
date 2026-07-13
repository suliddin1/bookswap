import { apiError, favoriteInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const listingId = new URL(request.url).searchParams.get("listingId");
    if (listingId) {
      const input = favoriteInput.parse({ listingId });
      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id)
        .eq("listing_id", input.listingId)
        .maybeSingle();
      if (error) throw error;
      return Response.json({ data: { saved: Boolean(data) } });
    }
    const { data, error } = await supabase
      .from("favorites")
      .select(
        "listing:listings(*, seller:users!listings_seller_id_fkey(id,name,city,created_at))",
      )
      .eq("user_id", user.id);
    if (error) throw error;
    return Response.json({
      data: (data ?? []).flatMap((item: any) =>
        item.listing ? [normalizeListing(item.listing)] : [],
      ),
    });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { listingId } = favoriteInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: user.id, listing_id: listingId });
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const { listingId } = favoriteInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
    if (error) throw error;
    return Response.json({ saved: false });
  } catch (error) {
    return apiError(error, 401);
  }
}
