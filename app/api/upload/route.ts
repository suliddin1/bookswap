import { ApiError, apiError, listingImageCleanupInput } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { logServerError } from "@/lib/server-log";
import { requireSupabaseAdmin } from "@/lib/supabase";
import {
  assertOwnedListingImages,
  drainListingImageCleanupJobs,
  queueListingImageCleanup,
} from "@/lib/listing-images";

export async function POST(request: Request) {
  let uploadedPaths: string[] = [];
  let uploadedUrls: string[] = [];
  let ownerId = "";
  let supabase: ReturnType<typeof requireSupabaseAdmin> | null = null;
  try {
    const user = await requireUser(request);
    ownerId = user.id;
    await assertRateLimit(request, "upload", {
      actorId: user.id,
      limit: 10,
      windowMs: 60_000,
    });
    const form = await request.formData();
    const files = form
      .getAll("images")
      .filter((item): item is File => item instanceof File);
    if (!files.length || files.length > 5)
      throw new ApiError(
        "Birdən beşə qədər şəkil yüklə.",
        422,
        "INVALID_IMAGE_COUNT",
      );
    supabase = requireSupabaseAdmin();
    await drainListingImageCleanupJobs(supabase, user.id);
    for (const file of files) {
      if (
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        throw new ApiError(
          "Şəkillər JPEG, PNG və ya WebP olmalı və 5 MB-dan böyük olmamalıdır.",
          422,
          "INVALID_IMAGE_FILE",
        );
      }
      if (!(await hasValidImageSignature(file)))
        throw new ApiError(
          "Fayllardan biri etibarlı şəkil deyil.",
          422,
          "INVALID_IMAGE_CONTENT",
        );
      const extension =
        file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      uploadedPaths.push(path);
      uploadedUrls.push(
        supabase.storage.from("listing-images").getPublicUrl(path).data
          .publicUrl,
      );
    }
    return Response.json({ data: uploadedUrls }, { status: 201 });
  } catch (error) {
    if (supabase && ownerId && uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from("listing-images")
        .remove(uploadedPaths);
      if (cleanupError) {
        try {
          await queueListingImageCleanup(supabase, ownerId, uploadedUrls);
        } catch (queueError) {
          logServerError("upload.cleanup_queue_failed", queueError, {
            method: request.method,
            path: "/api/upload",
          });
        }
      }
    }
    return apiError(error, 500, request);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const input = listingImageCleanupInput.parse(await request.json());
    await assertRateLimit(request, "cleanup-upload", {
      actorId: user.id,
      limit: 20,
      windowMs: 60_000,
    });
    assertOwnedListingImages(input.images, user.id);
    const supabase = requireSupabaseAdmin();
    const { data: referencedListings, error: referenceError } = await supabase
      .from("listings")
      .select("images")
      .eq("seller_id", user.id)
      .overlaps("images", input.images);
    if (referenceError) throw referenceError;

    const referencedUrls = new Set(
      (referencedListings ?? []).flatMap((listing) => listing.images ?? []),
    );
    const abandonedUrls = input.images.filter(
      (imageUrl) => !referencedUrls.has(imageUrl),
    );
    await queueListingImageCleanup(supabase, user.id, abandonedUrls);
    const cleanup = await drainListingImageCleanupJobs(supabase, user.id);

    return Response.json({
      accepted: abandonedUrls.length,
      referenced: input.images.length - abandonedUrls.length,
      cleanupPending: cleanup.pending > 0,
    });
  } catch (error) {
    return apiError(error, 500, request);
  }
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png")
    return bytes
      .slice(0, 8)
      .every(
        (value, index) =>
          value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index],
      );
  return (
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  );
}
