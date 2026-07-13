import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookswap-fawn.vercel.app";
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
    sitemap: `${base}/sitemap.xml`,
  };
}
