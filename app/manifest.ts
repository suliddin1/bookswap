import type { MetadataRoute } from "next";
import { AZ_COPY, DOCUMENT_LANGUAGE } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BookSwap",
    short_name: "BookSwap",
    description: AZ_COPY.metadata.description,
    lang: DOCUMENT_LANGUAGE,
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe5",
    theme_color: "#17140f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
