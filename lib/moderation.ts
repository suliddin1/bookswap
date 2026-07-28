import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api";
import type { Database } from "./database.types";

const localBlocklist = ["explicit abuse phrase", "scam payment request"];
const moderationResponse = z.object({
  id: z.string().min(1).max(200).optional(),
  results: z
    .array(
      z.object({
        flagged: z.boolean(),
        categories: z.record(z.boolean()).optional(),
      }),
    )
    .min(1),
});

export type ModerationOutcome = "approved" | "rejected" | "unavailable";

type ListingUpdateModerationInput = {
  currentStatus: "draft" | "active" | "sold" | "locked";
  requestedStatus?: "active" | "sold";
  textChanged: boolean;
  currentImages: string[];
  requestedImages?: string[];
};

export function planListingUpdateModeration({
  currentStatus,
  requestedStatus,
  textChanged,
  currentImages,
  requestedImages,
}: ListingUpdateModerationInput) {
  const finalImages = requestedImages ?? currentImages;
  const becomingPublic =
    requestedStatus === "active" && currentStatus !== "active";
  const currentImageSet = new Set(currentImages);

  return {
    moderateText: becomingPublic || textChanged,
    imageUrls: becomingPublic
      ? finalImages
      : finalImages.filter((imageUrl) => !currentImageSet.has(imageUrl)),
  };
}
export type ModerationSurface =
  | "listing_create"
  | "listing_update"
  | "chat_message"
  | "moderation_api";

export type ModerationDecision = {
  outcome: ModerationOutcome;
  provider: "local_rules" | "openai" | "none";
  reasonCode: string;
  reason: string;
  categories: string[];
  providerDecisionId: string | null;
};

type ModerationContext = {
  actorId: string;
  requestId: string;
  surface: ModerationSurface;
  targetId?: string | null;
};

const rejectedReason = "Məzmun BookSwap təhlükəsizlik qaydalarına uyğun deyil.";
const unavailableReason =
  "Məzmun yoxlama xidməti hazırda əlçatan deyil. Bir qədər sonra yenidən cəhd edin.";

function unavailable(
  provider: ModerationDecision["provider"],
  reasonCode: string,
): ModerationDecision {
  return {
    outcome: "unavailable",
    provider,
    reasonCode,
    reason: unavailableReason,
    categories: [],
    providerDecisionId: null,
  };
}

async function moderateWithOpenAI(
  input: string | Array<{ type: "image_url"; image_url: { url: string } }>,
): Promise<ModerationDecision> {
  if (!process.env.OPENAI_API_KEY)
    return unavailable("none", "PROVIDER_NOT_CONFIGURED");

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return unavailable(
      "openai",
      error instanceof Error && error.name === "TimeoutError"
        ? "PROVIDER_TIMEOUT"
        : "PROVIDER_UNREACHABLE",
    );
  }

  if (!response.ok)
    return unavailable(
      "openai",
      response.status === 429
        ? "PROVIDER_RATE_LIMITED"
        : "PROVIDER_REQUEST_FAILED",
    );

  let parsed: z.infer<typeof moderationResponse>;
  try {
    parsed = moderationResponse.parse(await response.json());
  } catch {
    return unavailable("openai", "PROVIDER_RESPONSE_INVALID");
  }

  const result = parsed.results[0];
  const categories = Object.entries(result.categories ?? {})
    .filter(([, flagged]) => flagged)
    .map(([category]) => category)
    .slice(0, 32);
  return {
    outcome: result.flagged ? "rejected" : "approved",
    provider: "openai",
    reasonCode: result.flagged ? "PROVIDER_FLAGGED" : "PROVIDER_APPROVED",
    reason: result.flagged ? rejectedReason : "Məzmun yoxlamadan keçdi.",
    categories,
    providerDecisionId: parsed.id ?? null,
  };
}

export async function moderateText(text: string): Promise<ModerationDecision> {
  const blocked = localBlocklist.find((phrase) =>
    text.toLocaleLowerCase("en").includes(phrase),
  );
  if (blocked) {
    return {
      outcome: "rejected",
      provider: "local_rules",
      reasonCode: "LOCAL_MARKETPLACE_RULE",
      reason: rejectedReason,
      categories: ["marketplace-safety"],
      providerDecisionId: null,
    };
  }
  return moderateWithOpenAI(text);
}

export async function moderateImage(
  imageUrl: string,
): Promise<ModerationDecision> {
  return moderateWithOpenAI([
    { type: "image_url", image_url: { url: imageUrl } },
  ]);
}

async function recordDecision(
  supabase: SupabaseClient<Database>,
  decision: ModerationDecision,
  contentType: "text" | "image",
  context: ModerationContext,
) {
  const { error } = await supabase.from("moderation_decisions").insert({
    request_id: context.requestId,
    actor_id: context.actorId,
    surface: context.surface,
    target_id: context.targetId ?? null,
    content_type: contentType,
    provider: decision.provider,
    outcome: decision.outcome,
    reason_code: decision.reasonCode,
    categories: decision.categories,
    provider_decision_id: decision.providerDecisionId,
  });
  if (error)
    throw new ApiError(
      "Məzmun yoxlamasının audit qeydi saxlanmadı. Bir qədər sonra yenidən cəhd edin.",
      503,
      "MODERATION_AUDIT_UNAVAILABLE",
    );
  return decision;
}

export async function moderateAndRecordText(
  supabase: SupabaseClient<Database>,
  text: string,
  context: ModerationContext,
) {
  return recordDecision(supabase, await moderateText(text), "text", context);
}

export async function moderateAndRecordImage(
  supabase: SupabaseClient<Database>,
  imageUrl: string,
  context: ModerationContext,
) {
  return recordDecision(
    supabase,
    await moderateImage(imageUrl),
    "image",
    context,
  );
}

export function assertModerationApproved(decision: ModerationDecision) {
  if (decision.outcome === "unavailable")
    throw new ApiError(decision.reason, 503, "MODERATION_UNAVAILABLE");
  if (decision.outcome === "rejected")
    throw new ApiError(decision.reason, 422, "CONTENT_REJECTED");
}
