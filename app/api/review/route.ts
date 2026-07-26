import { ApiError, apiError, assertRateLimit, reviewInput } from "@/lib/api";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "create-review", 10, 60_000);
    const input = reviewInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("buyer_id,listing:listings!inner(status)")
      .eq("listing_id", input.listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (roomError) throw roomError;
    const listing = Array.isArray(room?.listing)
      ? room.listing[0]
      : room?.listing;
    if (!room || listing?.status !== "sold")
      throw new ApiError(
        "Yalnız tamamlanmış satışın alıcısı rəy yaza bilər.",
        403,
        "REVIEW_NOT_ALLOWED",
      );
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        listing_id: input.listingId,
        author_id: user.id,
        rating: input.rating,
        comment: input.comment,
      })
      .select("id,listing_id,author_id,rating,comment,created_at")
      .single();
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error, 500);
  }
}
