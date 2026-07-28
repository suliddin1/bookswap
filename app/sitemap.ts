import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    "",
    "/listings",
    "/faq",
    "/safety",
    "/privacy",
    "/terms",
    "/marketplace-rules",
    "/moderation-appeals",
    "/user-rights",
  ].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: new Date(),
    changeFrequency:
      path === "/listings" ? ("daily" as const) : ("monthly" as const),
    priority: path === "" ? 1 : 0.7,
  }));
}
