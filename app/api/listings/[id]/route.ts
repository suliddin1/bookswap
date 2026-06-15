import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { apiError } from "@/lib/api";
import { normalizeListing } from "@/lib/listings";
import { requireUser } from "@/lib/auth";
import { listingInput } from "@/lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.from("listings").select("*, seller:users!listings_seller_id_fkey(*), reviews(*)").eq("id", id).single();
    if (error) return apiError(error, 404);
    return Response.json({ data: { ...normalizeListing(data), reviews: data.reviews ?? [] } });
  } catch (error) {
    return apiError(error, 503);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const input = listingInput.partial().parse(await request.json());
    const supabase = requireSupabaseAdmin();
    const updates = {
      title: input.title,
      author: input.author,
      description: input.description,
      isbn: input.isbn,
      price: input.price,
      images: input.images,
      category: input.category,
      condition: input.condition,
      city: input.city,
    };
    const { data, error } = await supabase.from("listings").update(updates).eq("id", id).eq("seller_id", user.id).select("*, seller:users!listings_seller_id_fkey(*)").single();
    if (error) throw error;
    return Response.json({ data: normalizeListing(data) });
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from("listings").delete().eq("id", id).eq("seller_id", user.id);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
