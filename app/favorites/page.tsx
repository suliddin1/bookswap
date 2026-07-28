import type { Metadata } from "next";
import { FavoritesPage } from "@/components/favorites-page";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.favorites.metadataTitle,
  description: AZ_COPY.favorites.metadataDescription,
  robots: { index: false, follow: false },
};

export default function FavoritesRoute() {
  return <FavoritesPage />;
}
