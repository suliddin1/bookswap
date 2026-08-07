import { z } from "zod";
import { LEGAL_VERSION } from "@/lib/legal";

export const legalSignupInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(12).max(128),
    termsVersion: z.literal(LEGAL_VERSION),
    privacyVersion: z.literal(LEGAL_VERSION),
    marketplaceRulesVersion: z.literal(LEGAL_VERSION),
    age18PlusConfirmed: z.literal(true),
    personalDataProcessingConsent: z.literal(true),
    crossBorderTransferDisclosedAndConsented: z.literal(true),
  })
  .strict();
