import { requireSupabaseAdmin } from "@/lib/supabase";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.from("chat_rooms").select("*, listing:listings(*, seller:users!listings_seller_id_fkey(*)), buyer:users!chat_rooms_buyer_id_fkey(*), seller:users!chat_rooms_seller_id_fkey(*)").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ data: (data ?? []).map((room: any) => ({ ...room, listing: normalizeListing(room.listing), currentUserId: user.id })) });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.listingId || !input.sellerId) throw new Error("Missing room details");
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const room = { listing_id: input.listingId, buyer_id: user.id, seller_id: input.sellerId };
    const { data, error } = await supabase.from("chat_rooms").upsert(room, { onConflict: "listing_id,buyer_id" }).select().single();
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
