"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useListings } from "@/hooks/use-listings";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAzn,
  formatCategory,
  formatCity,
  formatCondition,
  formatStars,
  localizeApiError,
} from "@/lib/i18n";
import type { Listing } from "@/lib/types";
import type { FormEvent } from "react";

type ListingReview = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  author?: { name?: string };
};

export function ListingDetail({ id }: { id: string }) {
  const [listing, setListing] = useState<
    (Listing & { reviews?: ListingReview[] }) | null
  >(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const { user } = useAuth();
  const { data } = useListings();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/listings/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(AZ_COPY.listingDetail.unavailableBody);
        setListing(body.data);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError(AZ_COPY.listingDetail.unavailableBody);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    authFetch(`/api/favorites?listingId=${encodeURIComponent(id)}`)
      .then((response) => response.json())
      .then((body) => setSaved(Boolean(body.data?.saved)))
      .catch(() => undefined);
  }, [id, user]);

  const displayedListing = useMemo(() => {
    if (!listing?.images?.length) return listing;
    const images = [
      listing.images[selectedImage],
      ...listing.images.filter((_, index) => index !== selectedImage),
    ];
    return { ...listing, images };
  }, [listing, selectedImage]);

  async function messageSeller() {
    if (!listing?.sellerId) return;
    setBusy(true);
    try {
      const response = await authFetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.href = `/chat/${body.data.id}`;
    } catch {
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!listing) return;
    try {
      const response = await authFetch("/api/favorites", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!response.ok) throw new Error();
      setSaved(!saved);
    } catch {
      window.location.href = "/login";
    }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
    if (!user) {
      setReportStatus(localizeApiError("AUTH_REQUIRED", ""));
      return;
    }
    setReportStatus(AZ_COPY.listingDetail.sending);
    try {
      const response = await authFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, reason: reportReason }),
      });
      const body = await response.json();
      if (!response.ok) {
        setReportStatus(
          localizeApiError(body.code, AZ_COPY.listingDetail.reportFailed),
        );
        return;
      }
      setReportStatus(AZ_COPY.listingDetail.reportReceived);
      setReportReason("");
    } catch {
      setReportStatus(AZ_COPY.listingDetail.reportFailed);
    }
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
    if (!user) {
      setReviewStatus(localizeApiError("AUTH_REQUIRED", ""));
      return;
    }
    setReviewStatus(AZ_COPY.listingDetail.sending);
    try {
      const response = await authFetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          rating,
          comment: reviewComment,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setReviewStatus(
          localizeApiError(body.code, AZ_COPY.listingDetail.reviewFailed),
        );
        return;
      }
      setListing({
        ...listing,
        reviews: [...(listing.reviews ?? []), body.data],
      });
      setReviewComment("");
      setReviewStatus(AZ_COPY.listingDetail.reviewPublished);
    } catch {
      setReviewStatus(AZ_COPY.listingDetail.reviewFailed);
    }
  }

  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.listingDetail.unavailableTitle}
          body={error}
          action={AZ_COPY.listingDetail.browseBooks}
          href="/listings"
          headingLevel="h1"
        />
      </div>
    );
  if (!listing || !displayedListing)
    return (
      <div className="container-shell min-h-[650px] animate-pulse py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="min-h-[520px] rounded-2xl bg-[#e5dece]" />
          <div className="space-y-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 rounded bg-[#e5dece]" />
            ))}
          </div>
        </div>
      </div>
    );

  const ownListing = user?.id === listing.sellerId;

  return (
    <div className="container-shell py-10 md:py-14">
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-orange"
      >
        <ArrowLeft size={14} /> {AZ_COPY.listingDetail.back}
      </Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.02fr]">
        <section>
          <div className="relative grid min-h-[560px] place-items-center rounded-[22px] border border-[#d8cbb5] bg-[#e8dfcf] p-14 shadow-[inset_0_0_70px_rgba(80,56,25,.08)]">
            <BookCover
              listing={displayedListing}
              className="w-full max-w-[310px]"
            />
            <span className="pill absolute bottom-5 left-5">
              <ShieldCheck size={12} className="text-orange" />{" "}
              {AZ_COPY.listingDetail.communityListing}
            </span>
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {listing.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`${AZ_COPY.listingDetail.photo} ${index + 1}`}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-orange" : "border-transparent"}`}
                >
                  <Image
                    unoptimized
                    src={image}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
        <section>
          <span className="eyebrow">
            {listing.status === "sold"
              ? AZ_COPY.listingDetail.soldByReader
              : AZ_COPY.listingDetail.availableFromReader}
          </span>
          <div className="mt-5 flex justify-between gap-5">
            <div>
              <h1 className="display text-5xl font-semibold leading-none md:text-7xl">
                {listing.title}
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                {AZ_COPY.listingDetail.author} {listing.author}
              </p>
            </div>
            <button
              aria-label={
                saved
                  ? AZ_COPY.listingDetail.remove
                  : AZ_COPY.listingDetail.save
              }
              onClick={toggleFavorite}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d8cbb5] bg-[#fffaf0] text-orange"
            >
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="mt-8 flex items-end gap-3 border-b border-[#d8cbb5] pb-8">
            <strong className="display text-5xl text-orange">
              {formatAzn(listing.price)}
            </strong>
            {listing.originalPrice && (
              <span className="mb-1 text-sm text-gray-400 line-through">
                {formatAzn(listing.originalPrice)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 border-b border-[#d8cbb5] py-7">
            {[
              [
                AZ_COPY.listingDetail.condition,
                formatCondition(listing.condition),
              ],
              [
                AZ_COPY.listingDetail.category,
                formatCategory(listing.category),
              ],
              [AZ_COPY.listingDetail.location, formatCity(listing.city)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-[8px] font-bold uppercase tracking-[.13em] text-gray-400">
                  {label}
                </span>
                <b className="mt-2 block text-xs">{value}</b>
              </div>
            ))}
          </div>
          <div className="py-7">
            <h2 className="display text-2xl font-semibold">
              {AZ_COPY.listingDetail.about}
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              {listing.description}
            </p>
            {listing.isbn && (
              <p className="mt-3 text-[9px] text-gray-400">
                ISBN {listing.isbn}
              </p>
            )}
          </div>
          <div className="card flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-bold text-orange">
                {listing.seller.initials}
              </span>
              <div>
                <Link
                  href={`/sellers/${listing.seller.id}`}
                  className="block text-xs font-bold hover:text-orange"
                >
                  {listing.seller.name}
                </Link>
                <span className="mt-1 block text-[9px] text-gray-500">
                  {AZ_COPY.listingDetail.reader}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="flex items-center gap-1 text-[9px] text-gray-500">
                <MapPin size={11} />{" "}
                {formatCity(listing.seller.city ?? listing.city)}
              </span>
              <Link
                href={`/sellers/${listing.seller.id}`}
                className="mt-1 block text-[9px] font-bold text-orange"
              >
                {AZ_COPY.listingDetail.viewSeller}
              </Link>
            </div>
          </div>
          {ownListing ? (
            <Link
              href={`/listings/${listing.id}/edit`}
              className="btn-secondary mt-5 w-full"
            >
              {AZ_COPY.listingDetail.manage}
            </Link>
          ) : listing.status === "active" ? (
            <button
              disabled={busy}
              onClick={messageSeller}
              className="btn-primary mt-5 w-full"
            >
              <MessageCircle size={15} />{" "}
              {busy
                ? AZ_COPY.listingDetail.openingConversation
                : AZ_COPY.listingDetail.messageSeller}
            </button>
          ) : (
            <p className="mt-5 rounded-xl bg-[#eee3c8] p-4 text-center text-xs font-bold">
              {AZ_COPY.listingDetail.soldNotice}
            </p>
          )}
        </section>
      </div>

      <section className="mt-20 grid gap-8 border-t border-[#d8cbb5] pt-12 lg:grid-cols-2">
        <div>
          <h2 className="display text-3xl font-semibold">
            {AZ_COPY.listingDetail.reviews}
          </h2>
          {listing.reviews?.length ? (
            <div className="mt-5 space-y-3">
              {listing.reviews.map((review) => (
                <article key={review.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <b className="text-xs">
                      {review.author?.name ?? AZ_COPY.listingDetail.reader}
                    </b>
                    <span
                      className="flex text-orange"
                      aria-label={formatStars(review.rating)}
                    >
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} size={12} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-gray-600">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-500">
              {AZ_COPY.listingDetail.noReviews}
            </p>
          )}
        </div>
        {listing.status === "sold" && !ownListing ? (
          <form onSubmit={submitReview} className="card p-6">
            <h3 className="display text-2xl font-semibold">
              {AZ_COPY.listingDetail.reviewTitle}
            </h3>
            <label className="mt-5 block">
              <span className="mb-2 block text-[9px] font-bold uppercase">
                {AZ_COPY.listingDetail.rating}
              </span>
              <select
                className="input"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {formatStars(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-[9px] font-bold uppercase">
                {AZ_COPY.listingDetail.comment}
              </span>
              <textarea
                required
                minLength={3}
                maxLength={1000}
                className="input min-h-[110px] py-3"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
            </label>
            {reviewStatus && (
              <p role="status" className="mt-3 text-[10px] text-gray-600">
                {reviewStatus}
              </p>
            )}
            <button className="btn-primary mt-4">
              {AZ_COPY.listingDetail.publishReview}
            </button>
          </form>
        ) : (
          <div className="card p-6">
            <h3 className="display text-2xl font-semibold">
              {AZ_COPY.listingDetail.safetyTitle}
            </h3>
            <p className="mt-3 text-xs leading-6 text-gray-600">
              {AZ_COPY.listingDetail.safetyBody}
            </p>
            <Link href="/safety" className="btn-secondary mt-5">
              {AZ_COPY.listingDetail.safetyAction}
            </Link>
          </div>
        )}
      </section>

      {!ownListing && (
        <details className="mt-10 rounded-xl border border-[#d8cbb5] bg-[#fffaf0]/60 p-5">
          <summary className="cursor-pointer text-xs font-bold">
            <AlertTriangle size={14} className="mr-2 inline text-orange" />
            {AZ_COPY.listingDetail.report}
          </summary>
          <form onSubmit={submitReport} className="mt-4 max-w-xl">
            <textarea
              required
              minLength={10}
              maxLength={500}
              className="input min-h-[100px] py-3"
              placeholder={AZ_COPY.listingDetail.reportPlaceholder}
              aria-label={AZ_COPY.listingDetail.report}
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
            />
            {reportStatus && (
              <p role="status" className="mt-2 text-[10px] text-gray-600">
                {reportStatus}
              </p>
            )}
            <button className="btn-secondary mt-3">
              {AZ_COPY.listingDetail.reportAction}
            </button>
          </form>
        </details>
      )}

      <section className="mt-24 border-t border-[#d8cbb5] pt-14">
        <h2 className="display text-4xl font-semibold">
          {AZ_COPY.listingDetail.similar}
        </h2>
        <div className="mt-9 grid grid-cols-2 gap-5 md:grid-cols-4">
          {data
            .filter(
              (item) =>
                item.id !== listing.id && item.category === listing.category,
            )
            .slice(0, 4)
            .map((item) => (
              <BookCard key={item.id} listing={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
