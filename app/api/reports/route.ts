import { ApiError, apiError, reportInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = reportInput.parse(await request.json());
    await assertRateLimit(request, "report-listing", {
      actorId: user.id,
      resourceId: input.listingId,
      limit: 8,
      windowMs: 60_000,
    });
    const supabase = requireSupabaseAdmin();
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id,seller_id")
      .eq("id", input.listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing)
      throw new ApiError("Elan tapılmadı.", 404, "LISTING_NOT_FOUND");
    if (listing.seller_id === user.id)
      throw new ApiError(
        "Öz elanını şikayət edə bilməzsən.",
        409,
        "OWN_LISTING",
      );
    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        listing_id: input.listingId,
        reason: input.reason,
      })
      .select("id,reporter_id,listing_id,status,created_at")
      .single();
    if (error?.code === "23505")
      throw new ApiError(
        "Bu elan üçün artıq açıq şikayətin var.",
        409,
        "REPORT_EXISTS",
      );
    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error, 500, request);
  }
}
