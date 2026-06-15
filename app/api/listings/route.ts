import { apiError, listingInput } from "@/lib/api";
import { moderateText } from "@/lib/moderation";
import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const limit = Math.min(Number(searchParams.get("limit") ?? 24), 50);

  try {
    const supabase = requireSupabaseClient();
    let builder = supabase.from("listings").select("*, seller:users!listings_seller_id_fkey(*)").eq("status", "active").order("created_at", { ascending: false }).limit(limit);
    if (query) builder = builder.textSearch("search", query, { type: "websearch" });
    if (category) builder = builder.eq("category", category);
    if (city) builder = builder.eq("city", city);
    const { data, error } = await builder;
    if (error) return apiError(error, 500);
    return Response.json({ data: (data ?? []).map(normalizeListing) });
  } catch (error) {
    return apiError(error, 503);
  }
}

export async function POST(request: Request) {
  try {
    const input = listingInput.parse(await request.json());
    const check = await moderateText(`${input.title}\n${input.description}`);
    if (!check.safe) return apiError(new Error(check.reason), 422);
    const supabase = requireSupabaseAdmin();
    const user = await requireUser(request);
    const { data, error } = await supabase.from("listings").insert({
      title: input.title,
      author: input.author,
      description: input.description,
      isbn: input.isbn,
      price: input.price,
      images: input.images,
      category: input.category,
      condition: input.condition,
      city: input.city,
      seller_id: user.id,
      status: "active",
    }).select("*, seller:users!listings_seller_id_fkey(*)").single();
    if (error) throw error;
    return Response.json({ data: normalizeListing(data) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
