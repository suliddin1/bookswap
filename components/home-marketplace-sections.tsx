"use client";

import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import {
  MarketplaceHeading,
  SkeletonShelf,
} from "@/components/home-section-shells";
import { useHomeListings } from "@/hooks/use-home-listings";
import { AZ_COPY } from "@/lib/i18n";

export function HomeListingSection({ kind }: { kind: "featured" | "recent" }) {
  const { data, loading, error } = useHomeListings();
  const featured = data.slice(0, 4);
  const recent = data.slice(4, 8);
  const listings = kind === "featured" ? featured : recent;
  const fallbackListings = kind === "recent" && !recent.length ? featured : [];
  const label =
    kind === "featured" ? AZ_COPY.home.featuredLabel : AZ_COPY.home.recentLabel;
  const title =
    kind === "featured" ? AZ_COPY.home.featuredTitle : AZ_COPY.home.recentTitle;

  return (
    <section className="py-20">
      <div className="container-shell">
        <MarketplaceHeading label={label} title={title} link="/listings" />
        {loading ? (
          <SkeletonShelf />
        ) : listings.length || fallbackListings.length ? (
          <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
            {[...listings, ...fallbackListings].map((listing) => (
              <BookCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : kind === "featured" ? (
          <div className="mt-10">
            <EmptyState
              title={AZ_COPY.home.featuredEmptyTitle}
              body={
                error
                  ? AZ_COPY.global.listingsUnavailable
                  : AZ_COPY.home.featuredEmptyBody
              }
              action={AZ_COPY.catalog.sellBook}
              href="/listings/new"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
