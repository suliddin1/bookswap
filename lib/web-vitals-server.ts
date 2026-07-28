import { z } from "zod";
import {
  MARKETPLACE_VITAL_ROUTES,
  WEB_VITAL_NAVIGATION_TYPES,
} from "./web-vitals";

const marketplaceVitalRouteSchema = z.enum(MARKETPLACE_VITAL_ROUTES);
const webVitalNavigationTypeSchema = z.enum(WEB_VITAL_NAVIGATION_TYPES);
const baseWebVitalPayload = {
  version: z.literal(1),
  route: marketplaceVitalRouteSchema,
  navigationType: webVitalNavigationTypeSchema,
};

export const webVitalPayloadSchema = z.discriminatedUnion("name", [
  z
    .object({
      ...baseWebVitalPayload,
      name: z.literal("LCP"),
      value: z.number().finite().min(0).max(120_000),
    })
    .strict(),
  z
    .object({
      ...baseWebVitalPayload,
      name: z.literal("CLS"),
      value: z.number().finite().min(0).max(10),
    })
    .strict(),
  z
    .object({
      ...baseWebVitalPayload,
      name: z.literal("INP"),
      value: z.number().finite().min(0).max(120_000),
    })
    .strict(),
]);
