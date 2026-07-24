export const CORE_WEB_VITAL_NAMES = ["LCP", "CLS", "INP"] as const;
export const MARKETPLACE_VITAL_ROUTES = [
  "home",
  "catalog",
  "listing-detail",
  "seller-storefront",
] as const;
export const WEB_VITAL_NAVIGATION_TYPES = [
  "navigate",
  "reload",
  "back-forward",
  "back-forward-cache",
  "prerender",
  "restore",
] as const;

export type CoreWebVitalName = (typeof CORE_WEB_VITAL_NAMES)[number];
export type MarketplaceVitalRoute = (typeof MARKETPLACE_VITAL_ROUTES)[number];
export type WebVitalNavigationType =
  (typeof WEB_VITAL_NAVIGATION_TYPES)[number];

export type WebVitalPayload = {
  version: 1;
  name: CoreWebVitalName;
  value: number;
  route: MarketplaceVitalRoute;
  navigationType: WebVitalNavigationType;
};
export type WebVitalRating = "good" | "needs-improvement" | "poor";

const UUID_PATH_SEGMENT =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const LISTING_DETAIL_PATH = new RegExp(`^/listings/${UUID_PATH_SEGMENT}$`, "i");
const SELLER_STOREFRONT_PATH = new RegExp(
  `^/sellers/${UUID_PATH_SEGMENT}$`,
  "i",
);

export function classifyMarketplaceVitalRoute(
  pathname: string,
): MarketplaceVitalRoute | null {
  if (pathname === "/") return "home";
  if (pathname === "/listings") return "catalog";
  if (LISTING_DETAIL_PATH.test(pathname)) return "listing-detail";
  if (SELLER_STOREFRONT_PATH.test(pathname)) return "seller-storefront";
  return null;
}

export function createWebVitalPayload(input: {
  name: string;
  value: number;
  navigationType: string;
  pathname: string;
}): WebVitalPayload | null {
  const route = classifyMarketplaceVitalRoute(input.pathname);
  if (!route) return null;
  const navigationType = WEB_VITAL_NAVIGATION_TYPES.find(
    (value) => value === input.navigationType,
  );
  if (!navigationType || !Number.isFinite(input.value) || input.value < 0) {
    return null;
  }

  const base = { version: 1 as const, value: input.value, route, navigationType };
  if (input.name === "CLS" && input.value <= 10) {
    return { ...base, name: "CLS" };
  }
  if (
    (input.name === "LCP" || input.name === "INP") &&
    input.value <= 120_000
  ) {
    return { ...base, name: input.name };
  }
  return null;
}

export function rateWebVital(
  name: CoreWebVitalName,
  value: number,
): WebVitalRating {
  const [good, poor] =
    name === "LCP" ? [2_500, 4_000] : name === "INP" ? [200, 500] : [0.1, 0.25];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}
