import type { MetadataRoute } from "next";
import { isPrivateBeta } from "@/lib/private-beta";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (isPrivateBeta()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/chat/",
        "/messages",
        "/notifications",
        "/profile",
      ],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
