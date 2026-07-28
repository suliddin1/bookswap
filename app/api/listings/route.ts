import { ApiError, apiError, listingInput } from "@/lib/api";
import { randomUUID } from "node:crypto";
import {
  assertModerationApproved,
  moderateAndRecordImage,
  moderateAndRecordText,
} from "@/lib/moderation";
import { requireSupabaseAdmin, requireSupabaseClient } from "@/lib/supabase";
import { assertOwnedListingImages } from "@/lib/security";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { logServerError } from "@/lib/server-log";
import { normalizeListing } from "@/lib/listings";
import {
  drainListingImageCleanupJobs,
  queueListingImageCleanup,
} from "@/lib/listing-images";
import {
  createListingCursorScope,
  decodeListingCursor,
  encodeListingCursor,
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
      throw new ApiError("Axtarış sorğusu çox uzundur.", 400, "INVALID_QUERY");
    if (category && !BOOK_CATEGORIES.includes(category as never))
      throw new ApiError("Kateqoriya etibarlı deyil.", 400, "INVALID_FILTER");
    if (city && !AZERBAIJAN_CITIES.includes(city as never))
      throw new ApiError("Məkan etibarlı deyil.", 400, "INVALID_FILTER");
    if (condition && !BOOK_CONDITIONS.includes(condition as never))
      throw new ApiError("Vəziyyət etibarlı deyil.", 400, "INVALID_FILTER");
    let maxPrice: number | null = null;
    if (maxPriceValue !== null) {
      const parsedMaxPrice = Number(maxPriceValue);
      if (
        !/^\d+(?:\.\d{1,2})?$/.test(maxPriceValue) ||
        !Number.isFinite(parsedMaxPrice) ||
        parsedMaxPrice <= 0 ||
        parsedMaxPrice > 10_000
      )
        throw new ApiError(
          "Maksimum qiymət etibarlı deyil.",
          400,
          "INVALID_FILTER",
        );
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
    const { data, error } = await supabase.rpc("catalog_listings_page", {
      p_query: query,
      p_category: category,
      p_city: city,
      p_condition: condition,
      p_max_price: maxPrice,
      p_sort: sort,
      p_cursor_created_at: cursor?.createdAt ?? null,
      p_cursor_price: cursor?.price ?? null,
      p_cursor_id: cursor?.id ?? null,
      p_limit: limit + 1,
    });
    if (error) return apiError(error, 500, request);
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
    return apiError(error, 503, request);
  }
}

export async function POST(request: Request) {
  let ownerId = "";
  let submittedImages: string[] = [];
  let supabase: ReturnType<typeof requireSupabaseAdmin> | null = null;
  try {
    const user = await requireUser(request);
    await assertRateLimit(request, "create-listing", {
      actorId: user.id,
      limit: 10,
      windowMs: 60_000,
    });
    ownerId = user.id;
    const input = listingInput.parse(await request.json());
    submittedImages = input.images;
    assertOwnedListingImages(input.images, user.id);
    supabase = requireSupabaseAdmin();
    const requestId = randomUUID();
    const checks = await Promise.all([
      moderateAndRecordText(supabase, `${input.title}\n${input.description}`, {
        actorId: user.id,
        requestId,
        surface: "listing_create",
      }),
      ...input.images.map((imageUrl) =>
        moderateAndRecordImage(supabase!, imageUrl, {
          actorId: user.id,
          requestId,
          surface: "listing_create",
        }),
      ),
    ]);
    checks.forEach(assertModerationApproved);
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
        logServerError("listing.create_cleanup_failed", cleanupError, {
          method: request.method,
          path: "/api/listings",
        });
      }
    }
    return apiError(error, 500, request);
  }
}
