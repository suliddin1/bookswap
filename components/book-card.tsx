"use client";

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { authFetch, LocalizedClientError } from "@/lib/client-api";
import { getResponseErrorCode, readResponseJson } from "@/lib/client-responses";
import { parseFavoriteMutationResponse } from "@/lib/listing-detail-action-responses";
import {
  AZ_COPY,
  formatAzn,
  formatCity,
  formatCondition,
  localizeApiError,
} from "@/lib/i18n";
import type { Listing } from "@/lib/types";

type FavoriteState = { listingId: string; saved: boolean };
type FavoriteStatus = { listingId: string; message: string };

export function BookCard({
  listing,
  saved = false,
}: {
  listing: Listing;
  saved?: boolean;
}) {
  const [favoriteState, setFavoriteState] = useState<FavoriteState>({
    listingId: listing.id,
    saved,
  });
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({
    listingId: listing.id,
    message: "",
  });
  const [pendingListingId, setPendingListingId] = useState<string | null>(null);
  const activeListingId = useRef(listing.id);
  const favoriteRequest = useRef(0);
  const isSaved =
    favoriteState.listingId === listing.id ? favoriteState.saved : saved;
  const status =
    favoriteStatus.listingId === listing.id ? favoriteStatus.message : "";
  const busy = pendingListingId === listing.id;
  const statusId = useId();

  useEffect(() => {
    activeListingId.current = listing.id;
    favoriteRequest.current += 1;
    setFavoriteState({ listingId: listing.id, saved });
    setFavoriteStatus({ listingId: listing.id, message: "" });
    setPendingListingId(null);
  }, [listing.id, saved]);

  async function toggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    const listingId = listing.id;
    const expectedSaved = !isSaved;
    const requestId = ++favoriteRequest.current;
    setPendingListingId(listingId);
    setFavoriteStatus({ listingId, message: "" });
    try {
      const response = await authFetch("/api/favorites", {
        method: expectedSaved ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const body = await readResponseJson(response);
      const code = getResponseErrorCode(body);
      if (!response.ok)
        throw new LocalizedClientError(
          localizeApiError(code, AZ_COPY.listingCard.favoriteFailed),
          typeof code === "string" ? code : undefined,
        );
      const parsed = parseFavoriteMutationResponse(
        body,
        listingId,
        expectedSaved,
      );
      if (!parsed) throw new Error();
      if (
        activeListingId.current === listingId &&
        favoriteRequest.current === requestId
      )
        setFavoriteState({ listingId, saved: parsed.saved });
    } catch (reason) {
      if (
        reason instanceof LocalizedClientError &&
        reason.code === "AUTH_REQUIRED"
      ) {
        window.location.href = "/login";
        return;
      }
      if (
        activeListingId.current === listingId &&
        favoriteRequest.current === requestId
      )
        setFavoriteStatus({
          listingId,
          message:
            reason instanceof LocalizedClientError
              ? reason.message
              : AZ_COPY.listingCard.favoriteFailed,
        });
    } finally {
      if (
        activeListingId.current === listingId &&
        favoriteRequest.current === requestId
      )
        setPendingListingId(null);
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
        type="button"
        aria-label={
          isSaved ? AZ_COPY.listingCard.remove : AZ_COPY.listingCard.save
        }
        aria-pressed={isSaved}
        aria-busy={busy}
        aria-disabled={busy}
        aria-describedby={status ? statusId : undefined}
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
        {status && (
          <p
            id={statusId}
            role="status"
            aria-atomic="true"
            className="relative z-10 mt-3 break-words text-xs font-semibold text-red-700"
          >
            {status}
          </p>
        )}
      </div>
    </article>
  );
}
