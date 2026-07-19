import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { ApiError } from "./api";

const BUCKET = "listing-images";
const PUBLIC_PATH_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const SAFE_IMAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

export function getOwnedListingImagePath(value: string, userId: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) throw new Error("Supabase public URL is not configured.");

  let imageUrl: URL;
  let expectedUrl: URL;
  try {
    imageUrl = new URL(value);
    expectedUrl = new URL(projectUrl);
  } catch {
    throw invalidImagePath();
  }

  const encodedPrefix = `${PUBLIC_PATH_PREFIX}${userId}/`;
  let imageName = "";
  try {
    imageName = decodeURIComponent(
      imageUrl.pathname.slice(encodedPrefix.length),
    );
  } catch {
    throw invalidImagePath();
  }

  if (
    imageUrl.protocol !== "https:" ||
    imageUrl.host !== expectedUrl.host ||
    imageUrl.username ||
    imageUrl.password ||
    imageUrl.search ||
    imageUrl.hash ||
    !imageUrl.pathname.startsWith(encodedPrefix) ||
    !SAFE_IMAGE_NAME.test(imageName)
  ) {
    throw invalidImagePath();
  }

  return `${userId}/${imageName}`;
}

function invalidImagePath() {
  return new ApiError(
    "Elan şəkilləri BookSwap üzərindən yüklənməlidir.",
    422,
    "INVALID_IMAGE_PATH",
  );
}

export function assertOwnedListingImages(urls: string[], userId: string) {
  urls.forEach((url) => getOwnedListingImagePath(url, userId));
}

type CleanupResult = {
  deleted: number;
  referenced: number;
  pending: number;
};

type CleanupJob = { id: number; image_url: string };
type ListingImageReference = { images: string[] | null };

export function partitionListingImageCleanupJobs(
  jobs: CleanupJob[],
  listings: ListingImageReference[],
) {
  const referencedUrls = new Set(
    listings.flatMap((listing) => listing.images ?? []),
  );
  return {
    referencedJobs: jobs.filter((job) => referencedUrls.has(job.image_url)),
    removableJobs: jobs.filter((job) => !referencedUrls.has(job.image_url)),
  };
}

export async function queueListingImageCleanup(
  supabase: SupabaseClient<Database>,
  userId: string,
  imageUrls: string[],
  listingId: string | null = null,
) {
  const uniqueImageUrls = Array.from(new Set(imageUrls));
  if (!uniqueImageUrls.length) return;
  const { error } = await supabase.from("listing_image_cleanup_jobs").upsert(
    uniqueImageUrls.map((imageUrl) => ({
      user_id: userId,
      listing_id: listingId,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,image_url" },
  );
  if (error) throw error;
}

export async function drainListingImageCleanupJobs(
  supabase: SupabaseClient<Database>,
  userId: string,
  listingId?: string,
): Promise<CleanupResult> {
  let jobsQuery = supabase
    .from("listing_image_cleanup_jobs")
    .select("id,image_url")
    .eq("user_id", userId)
    .order("created_at")
    .order("id")
    .limit(50);
  if (listingId) jobsQuery = jobsQuery.eq("listing_id", listingId);

  const { data: jobs, error: jobsError } = await jobsQuery;
  if (jobsError) throw jobsError;
  if (!jobs?.length) return { deleted: 0, referenced: 0, pending: 0 };

  const imageUrls = jobs.map((job) => job.image_url);
  const { data: referencedListings, error: referenceError } = await supabase
    .from("listings")
    .select("images")
    .eq("seller_id", userId)
    .overlaps("images", imageUrls);
  if (referenceError) throw referenceError;

  const { referencedJobs, removableJobs } = partitionListingImageCleanupJobs(
    jobs,
    referencedListings ?? [],
  );

  if (referencedJobs.length) {
    const { error } = await supabase
      .from("listing_image_cleanup_jobs")
      .delete()
      .in(
        "id",
        referencedJobs.map((job) => job.id),
      );
    if (error) throw error;
  }

  if (!removableJobs.length)
    return { deleted: 0, referenced: referencedJobs.length, pending: 0 };

  const validJobs: Array<{ job: CleanupJob; path: string }> = [];
  const invalidJobs: CleanupJob[] = [];
  for (const job of removableJobs) {
    try {
      validJobs.push({
        job,
        path: getOwnedListingImagePath(job.image_url, userId),
      });
    } catch {
      invalidJobs.push(job);
    }
  }

  if (invalidJobs.length) {
    await markCleanupFailure(
      supabase,
      invalidJobs.map((job) => job.id),
      "Invalid or foreign listing image path",
    );
  }
  if (!validJobs.length)
    return {
      deleted: 0,
      referenced: referencedJobs.length,
      pending: invalidJobs.length,
    };

  const { error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove(validJobs.map(({ path }) => path));
  if (removeError) {
    await markCleanupFailure(
      supabase,
      validJobs.map(({ job }) => job.id),
      removeError.message,
    );
    return {
      deleted: 0,
      referenced: referencedJobs.length,
      pending: invalidJobs.length + validJobs.length,
    };
  }

  const { error: deleteError } = await supabase
    .from("listing_image_cleanup_jobs")
    .delete()
    .in(
      "id",
      validJobs.map(({ job }) => job.id),
    );
  if (deleteError) throw deleteError;

  return {
    deleted: validJobs.length,
    referenced: referencedJobs.length,
    pending: invalidJobs.length,
  };
}

async function markCleanupFailure(
  supabase: SupabaseClient<Database>,
  jobIds: number[],
  message: string,
) {
  const now = new Date().toISOString();
  for (const id of jobIds) {
    const { data: job, error: readError } = await supabase
      .from("listing_image_cleanup_jobs")
      .select("attempts")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    const { error: updateError } = await supabase
      .from("listing_image_cleanup_jobs")
      .update({
        attempts: job.attempts + 1,
        last_error: message.slice(0, 1000),
        updated_at: now,
      })
      .eq("id", id);
    if (updateError) throw updateError;
  }
}
