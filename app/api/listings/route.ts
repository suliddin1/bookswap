import { ApiError, apiError, assertRateLimit, listingInput } from "@/lib/api";
import { moderateText } from "@/lib/moderation";
import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { assertOwnedListingImages } from "@/lib/security";
import { requireUser } from "@/lib/auth";
import { normalizeListing } from "@/lib/listings";
import {
  drainListingImageCleanupJobs,
  queueListingImageCleanup,
} from "@/lib/listing-images";
import {
  createListingCursorScope,
  decodeListingCursor,
  encodeListingCursor,
  getListingCursorFilter,
  parseListingLimit,
  parseListingSort,
} from "@/lib/listing-pagination";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "@/lib/marketplace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const condition = searchParams.get("condition");
  const maxPriceValue = searchParams.get("maxPrice");

  try {
    if (query.length > 200)
      throw new ApiError("Search query is too long.", 400, "INVALID_QUERY");
    if (category && !BOOK_CATEGORIES.includes(category as never))
      throw new ApiError("Unsupported category.", 400, "INVALID_FILTER");
    if (city && !AZERBAIJAN_CITIES.includes(city as never))
      throw new ApiError("Unsupported city.", 400, "INVALID_FILTER");
    if (condition && !BOOK_CONDITIONS.includes(condition as never))
      throw new ApiError("Unsupported condition.", 400, "INVALID_FILTER");
    let maxPrice: number | null = null;
    if (maxPriceValue !== null) {
      const parsedMaxPrice = Number(maxPriceValue);
      if (
        !/^\d+(?:\.\d{1,2})?$/.test(maxPriceValue) ||
        !Number.isFinite(parsedMaxPrice) ||
        parsedMaxPrice <= 0 ||
        parsedMaxPrice > 10_000
      )
        throw new ApiError("Invalid maximum price.", 400, "INVALID_FILTER");
      maxPrice = parsedMaxPrice;
    }
    const sort = parseListingSort(searchParams.get("sort"));
    const limit = parseListingLimit(searchParams.get("limit"));
    const scope = createListingCursorScope({
      category,
      city,
      condition,
      maxPrice,
      query,
      sort,
      type: "catalog",
    });
    const cursor = decodeListingCursor(searchParams.get("cursor"), sort, scope);
    const supabase = requireSupabaseClient();
    let builder = supabase
      .from("listings")
      .select(
        "*, seller:users!listings_seller_id_fkey(id,name,city,created_at)",
      )
      .eq("status", "active")
      .limit(limit + 1);
    if (sort === "price-low")
      builder = builder
        .order("price", { ascending: true })
        .order("id", { ascending: true });
    else if (sort === "price-high")
      builder = builder
        .order("price", { ascending: false })
        .order("id", { ascending: false });
    else
      builder = builder
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    if (query)
      builder = builder.textSearch("search", query, { type: "websearch" });
    if (category) builder = builder.eq("category", category);
    if (city) builder = builder.eq("city", city);
    if (condition) builder = builder.eq("condition", condition);
    if (maxPrice !== null) builder = builder.lte("price", maxPrice);
    if (cursor) builder = builder.or(getListingCursorFilter(cursor));
    const { data, error } = await builder;
    if (error) return apiError(error, 500);
    const rows = data ?? [];
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    return Response.json({
      data: {
        items: pageRows.map(normalizeListing),
        nextCursor:
          rows.length > limit && last
            ? encodeListingCursor(last, sort, scope)
            : null,
      },
    });
  } catch (error) {
    return apiError(error, 503);
  }
}

export async function POST(request: Request) {
  let ownerId = "";
  let submittedImages: string[] = [];
  let supabase: ReturnType<typeof requireSupabaseAdmin> | null = null;
  try {
    assertRateLimit(request, "create-listing", 10, 60_000);
    const user = await requireUser(request);
    ownerId = user.id;
    const input = listingInput.parse(await request.json());
    submittedImages = input.images;
    assertOwnedListingImages(input.images, user.id);
    supabase = requireSupabaseAdmin();
    const check = await moderateText(`${input.title}\n${input.description}`);
    if (!check.safe) throw new ApiError(check.reason, 422, "CONTENT_REJECTED");
    await drainListingImageCleanupJobs(supabase, user.id);
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
    if (supabase && ownerId && submittedImages.length) {
      try {
        await queueListingImageCleanup(supabase, ownerId, submittedImages);
        await drainListingImageCleanupJobs(supabase, ownerId);
      } catch (cleanupError) {
        console.error(
          "Could not compensate failed listing creation",
          cleanupError,
        );
      }
    }
    return apiError(error, 500);
  }
}
