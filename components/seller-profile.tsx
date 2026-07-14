"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, MapPin, Star } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookSkeleton } from "@/components/book-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  AZ_COPY,
  formatAzDate,
  formatCity,
  formatLoadedBooks,
  formatReviewSummary,
} from "@/lib/i18n";
import type { Listing } from "@/lib/types";

type PublicSeller = {
  id: string;
  name: string;
  city: string | null;
  createdAt: string;
  initials: string;
  rating: number | null;
  reviewCount: number;
};

export function SellerProfile({ id }: { id: string }) {
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    const controller = new AbortController();
    setLoading(true);
    setLoadingMore(false);
    setSeller(null);
    setItems([]);
    setNextCursor(null);
    setError("");
    fetch(`/api/sellers/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(AZ_COPY.seller.unavailable);
        if (version !== requestVersion.current) return;
        setSeller(body.data.seller);
        setItems(body.data.items ?? []);
        setNextCursor(body.data.nextCursor ?? null);
        setError("");
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        if (version === requestVersion.current)
          setError(AZ_COPY.seller.unavailable);
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/sellers/${id}?cursor=${encodeURIComponent(nextCursor)}`,
      );
      const body = await response.json();
      if (!response.ok) throw new Error(AZ_COPY.seller.loadMoreUnavailable);
      if (version !== requestVersion.current) return;
      setItems((current) => {
        const known = new Set(current.map((listing) => listing.id));
        return [
          ...current,
          ...(body.data.items ?? []).filter(
            (listing: Listing) => !known.has(listing.id),
          ),
        ];
      });
      setNextCursor(body.data.nextCursor ?? null);
      setError("");
    } catch {
      if (version === requestVersion.current)
        setError(AZ_COPY.seller.loadMoreUnavailable);
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }

  if (loading)
    return (
      <div className="container-shell py-12 md:py-16">
        <div className="h-52 animate-pulse rounded-sm bg-[#e5dece]" />
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <BookSkeleton key={item} />
          ))}
        </div>
      </div>
    );

  if (!seller)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.seller.unavailableTitle}
          body={error || AZ_COPY.seller.unavailableBody}
          action={AZ_COPY.seller.browseBooks}
          href="/listings"
          headingLevel="h1"
        />
      </div>
    );

  const joined = formatAzDate(seller.createdAt, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-shell py-10 md:py-14">
      <section className="catalog-drawer rounded-sm p-6 md:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-ink text-xl font-bold text-orange">
            {seller.initials}
          </span>
          <div className="min-w-0 flex-1">
            <span className="bookmark-badge">{AZ_COPY.seller.badge}</span>
            <h1 className="display mt-4 text-4xl font-semibold md:text-6xl">
              {seller.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} /> {formatCity(seller.city || "Azerbaijan")}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} /> {AZ_COPY.seller.joined} {joined}
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={12} className="text-orange" />
                {seller.rating === null
                  ? AZ_COPY.seller.noReviews
                  : formatReviewSummary(seller.rating, seller.reviewCount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-7 flex items-end justify-between border-b-2 border-[#5b3c25] pb-4">
          <div>
            <span className="eyebrow">{AZ_COPY.seller.publicInventory}</span>
            <h2 className="display mt-3 text-3xl font-semibold">
              {AZ_COPY.seller.inventoryTitle}
            </h2>
          </div>
          <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-gray-500">
            <BookOpen size={13} className="text-orange" />{" "}
            {formatLoadedBooks(items.length)}
          </span>
        </div>

        {items.length ? (
          <>
            <div className="shelf-row grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 lg:grid-cols-4">
              {items.map((listing) => (
                <BookCard key={listing.id} listing={listing} />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-12 flex justify-center">
                <button
                  className="btn-secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? AZ_COPY.seller.loadingMore
                    : AZ_COPY.seller.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={AZ_COPY.seller.emptyTitle}
            body={AZ_COPY.seller.emptyBody}
            action={AZ_COPY.seller.browseCatalog}
            href="/listings"
          />
        )}
        {error && (
          <p role="alert" className="mt-5 text-center text-xs text-red-700">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
