import { apiError, reviewInput } from "@/lib/api";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const input = reviewInput.parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const { data: room } = await supabase.from("chat_rooms").select("buyer_id,listings!inner(status)").eq("listing_id", input.listingId).eq("buyer_id", user.id).single();
    if (!room) throw new Error("Only the buyer can review a completed sale");
    const { data, error } = await supabase.from("reviews").insert({ listing_id: input.listingId, author_id: user.id, rating: input.rating, comment: input.comment }).select().single();
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
