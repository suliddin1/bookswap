import { ApiError, apiError, assertRateLimit, listingInput } from "@/lib/api";
import { moderateText } from "@/lib/moderation";
import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { assertOwnedListingImages } from "@/lib/security";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const parsedLimit = Number(searchParams.get("limit") ?? 24);
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(parsedLimit, 50))
    : 24;
  const sort = searchParams.get("sort") ?? "newest";

  try {
    const supabase = requireSupabaseClient();
    let builder = supabase
      .from("listings")
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("status", "active")
      .limit(limit);
    if (sort === "price-low")
      builder = builder.order("price", { ascending: true }).order("id");
    else if (sort === "price-high")
      builder = builder.order("price", { ascending: false }).order("id");
    else
      builder = builder
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    if (query)
      builder = builder.textSearch("search", query, { type: "websearch" });
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
    assertRateLimit(request, "create-listing", 10, 60_000);
    const user = await requireUser(request);
    const input = listingInput.parse(await request.json());
    assertOwnedListingImages(input.images, user.id);
    const check = await moderateText(`${input.title}\n${input.description}`);
    if (!check.safe) throw new ApiError(check.reason, 422, "CONTENT_REJECTED");
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("listings")
      .insert({
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
      })
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
      )
      .single();
    if (error) throw error;
    return Response.json({ data: normalizeListing(data) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
