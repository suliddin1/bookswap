import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api";
import type { Database } from "./database.types";

const prohibitedTextRules = [
  {
    reasonCode: "SENSITIVE_AUTH_CODE_REQUEST",
    category: "credential-theft",
    pattern:
      /(?:\bcvv\b|\bpin\b|\botp\b|birdəfəlik\s+kod).{0,24}(?:göndər|paylaş|yaz)/i,
  },
] as const;

type ListingUpdateModerationInput = {
  currentStatus: "draft" | "active" | "sold" | "locked";
  requestedStatus?: "active" | "sold";
  textChanged: boolean;
};

export function planListingUpdateModeration({
  currentStatus,
  requestedStatus,
  textChanged,
}: ListingUpdateModerationInput) {
  const becomingPublic =
    requestedStatus === "active" && currentStatus !== "active";

  return { moderateText: becomingPublic || textChanged };
}

export type ModerationOutcome = "approved" | "rejected";

export type ModerationSurface =
  | "listing_create"
  | "listing_update"
  | "chat_message";

export type ModerationDecision = {
  outcome: ModerationOutcome;
  provider: "local_rules";
  reasonCode: string;
  reason: string;
  categories: string[];
  providerDecisionId: null;
};

type ModerationContext = {
  actorId: string;
  requestId: string;
  surface: ModerationSurface;
  targetId?: string | null;
};

const rejectedReason = "Məzmun BookSwap təhlükəsizlik qaydalarına uyğun deyil.";

export async function moderateText(text: string): Promise<ModerationDecision> {
  const normalizedText = text.normalize("NFKC").toLocaleLowerCase("az");
  const rejectedRule = prohibitedTextRules.find(({ pattern }) =>
    pattern.test(normalizedText),
  );

  if (rejectedRule) {
    return {
      outcome: "rejected",
      provider: "local_rules",
      reasonCode: rejectedRule.reasonCode,
      reason: rejectedReason,
      categories: [rejectedRule.category],
      providerDecisionId: null,
    };
  }

  return {
    outcome: "approved",
    provider: "local_rules",
    reasonCode: "LOCAL_RULES_PASSED",
    reason:
      "Mətn dar təhlükəsizlik qaydalarından keçdi; məzmun hərtərəfli avtomatik qiymətləndirilməyib.",
    categories: [],
    providerDecisionId: null,
  };
}

async function recordDecision(
  supabase: SupabaseClient<Database>,
  decision: ModerationDecision,
  context: ModerationContext,
) {
  const { error } = await supabase.from("moderation_decisions").insert({
    request_id: context.requestId,
    actor_id: context.actorId,
    surface: context.surface,
    target_id: context.targetId ?? null,
    content_type: "text",
    provider: decision.provider,
    outcome: decision.outcome,
    reason_code: decision.reasonCode,
    categories: decision.categories,
    provider_decision_id: null,
  });
  if (error)
    throw new ApiError(
      "Məzmun qayda yoxlamasının audit qeydi saxlanmadı. Bir qədər sonra yenidən cəhd edin.",
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
  return recordDecision(supabase, await moderateText(text), context);
}

export function assertModerationApproved(decision: ModerationDecision) {
  if (decision.outcome === "rejected")
    throw new ApiError(decision.reason, 422, "CONTENT_REJECTED");
}
