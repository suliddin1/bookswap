import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BookSwap",
    short_name: "BookSwap",
    description: "A private-library marketplace for books with another chapter left.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe5",
    theme_color: "#17140f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
