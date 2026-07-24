"use client";

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { BookCover } from "@/components/book-cover";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY, formatAzn, formatCity, formatCondition } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

export function BookCard({
  listing,
  saved = false,
}: {
  listing: Listing;
  saved?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(saved);

  async function toggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const response = await authFetch("/api/favorites", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!response.ok) throw new Error();
      setIsSaved(!isSaved);
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <article className="book-card market-book-card group">
      <Link href={`/listings/${listing.id}`} className="relative block">
        <BookCover listing={listing} />
        {listing.status === "sold" && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
            {AZ_COPY.listingCard.sold}
          </span>
        )}
        <span className="bookmark-badge absolute -left-2 top-4 z-10 !px-3 !pb-1">
          {formatCondition(listing.condition)}
        </span>
      </Link>
      <button
        aria-label={
          isSaved ? AZ_COPY.listingCard.remove : AZ_COPY.listingCard.save
        }
        onClick={toggleFavorite}
        className={`absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-[#fffaf0]/95 shadow-sm transition ${isSaved ? "text-orange" : "text-ink hover:text-orange"}`}
      >
        <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
      </button>
      <div className="pt-5">
        <div className="mb-1 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex min-h-6 min-w-0 max-w-full items-center"
            >
              <h3 className="min-w-0 max-w-full truncate text-sm font-extrabold tracking-tight">
                {listing.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-xs text-muted">{listing.author}</p>
          </div>
          <strong className="display text-xl text-orange">
            {formatAzn(listing.price)}
          </strong>
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#95866f] pt-3 text-xs font-bold text-muted">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={11} /> {formatCity(listing.city)}
          </span>
          {listing.seller.id ? (
            <Link
              href={`/sellers/${listing.seller.id}`}
              className="inline-flex min-h-6 min-w-0 max-w-full items-center truncate hover:text-orange"
            >
              {listing.seller.name}
            </Link>
          ) : (
            <span className="truncate">{listing.seller.name}</span>
          )}
        </div>
      </div>
    </article>
  );
}
