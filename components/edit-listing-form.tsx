"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ImagePlus, X } from "lucide-react";
import { authFetch } from "@/lib/client-api";
import type { Listing } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import {
  cleanupUploadedListingImages,
  MAX_LISTING_IMAGES,
  uploadListingImages,
  validateListingImageFiles,
} from "@/lib/client-listing-images";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "@/lib/marketplace";
import {
  AZ_COPY,
  formatCategory,
  formatCity,
  formatCondition,
  localizeApiError,
} from "@/lib/i18n";
import type { ChangeEvent, FormEvent } from "react";

export function EditListingForm({ id }: { id: string }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cleanupPending, setCleanupPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/listings/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(AZ_COPY.listingForm.editUnavailableBody);
        setListing(body.data);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError(AZ_COPY.listingForm.editUnavailableBody);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    if (!listing) return;
    const selected = Array.from(event.target.files ?? []);
    const validationError = validateListingImageFiles(selected);
    const existingCount = listing.images?.length ?? 0;
    if (
      validationError ||
      existingCount + selected.length > MAX_LISTING_IMAGES
    ) {
      setFiles([]);
      setError(validationError ?? AZ_COPY.listingForm.maxPhotos);
      event.target.value = "";
      return;
    }
    setFiles(selected);
    setError("");
    setSaved(false);
    event.target.value = "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!listing || busy) return;
    const existingImages = listing.images ?? [];
    if (existingImages.length + files.length < 1) {
      setError(AZ_COPY.listingForm.atLeastOnePhoto);
      return;
    }

    setBusy(true);
    setError("");
    setSaved(false);
    setCleanupPending(false);
    let uploadedImages: string[] = [];
    try {
      if (files.length) uploadedImages = await uploadListingImages(files);
      const response = await authFetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          author: listing.author,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          city: listing.city,
          images: [...existingImages, ...uploadedImages],
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.listingForm.saveFailed),
        );
      setListing(body.data);
      setFiles([]);
      setCleanupPending(Boolean(body.imageCleanupPending));
      setSaved(true);
    } catch (reason) {
      let message =
        reason instanceof Error
          ? reason.message
          : AZ_COPY.listingForm.saveFailed;
      if (uploadedImages.length) {
        try {
          const cleanup = await cleanupUploadedListingImages(uploadedImages);
          setCleanupPending(cleanup.cleanupPending);
        } catch {
          message += ` ${AZ_COPY.listingForm.cleanupQueued}`;
          setCleanupPending(true);
        }
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !listing)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.listingForm.editUnavailableTitle}
          body={error}
          action={AZ_COPY.listingForm.myShelf}
          href="/profile"
          headingLevel="h1"
        />
      </div>
    );
  if (!listing)
    return (
      <div className="container-shell min-h-[600px] animate-pulse py-16">
        <div className="mx-auto h-[500px] max-w-2xl rounded-2xl bg-[#e5dece]" />
      </div>
    );

  const existingImages = listing.images ?? [];
  const field = (key: keyof Listing, label: string, type = "text") => (
    <label>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
        {label}
      </span>
      <input
        required
        className="input"
        type={type}
        min={type === "number" ? "0.01" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={String(listing[key] ?? "")}
        onChange={(event) => {
          setSaved(false);
          setListing({
            ...listing,
            [key]:
              type === "number"
                ? Number(event.target.value)
                : event.target.value,
          });
        }}
      />
    </label>
  );
  const selectField = (
    key: "category" | "condition" | "city",
    label: string,
    options: readonly string[],
    formatOption: (value: string) => string,
  ) => (
    <label>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
        {label}
      </span>
      <select
        className="input"
        value={listing[key]}
        onChange={(event) => {
          setSaved(false);
          setListing({ ...listing, [key]: event.target.value });
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="container-shell py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500"
        >
          <ArrowLeft size={13} /> {AZ_COPY.listingForm.myShelf}
        </Link>
        <span className="eyebrow mt-8">{AZ_COPY.listingForm.manageBadge}</span>
        <h1 className="display mt-4 text-5xl font-semibold">
          {AZ_COPY.listingForm.editTitle}
        </h1>
        <form onSubmit={submit} className="card mt-8 grid gap-5 p-6 md:p-8">
          {field("title", AZ_COPY.listingForm.bookTitle)}
          {field("author", AZ_COPY.listingForm.author)}
          <label>
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
              {AZ_COPY.listingForm.description}
            </span>
            <textarea
              className="input min-h-[130px] py-3"
              value={listing.description}
              onChange={(event) => {
                setSaved(false);
                setListing({ ...listing, description: event.target.value });
              }}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("price", AZ_COPY.listingForm.price, "number")}
            {selectField(
              "city",
              AZ_COPY.listingForm.location,
              AZERBAIJAN_CITIES,
              formatCity,
            )}
            {selectField(
              "category",
              AZ_COPY.listingForm.category,
              BOOK_CATEGORIES,
              formatCategory,
            )}
            {selectField(
              "condition",
              AZ_COPY.listingForm.condition,
              BOOK_CONDITIONS,
              formatCondition,
            )}
          </div>

          <fieldset className="border-t border-[#ded4c1] pt-5">
            <legend className="text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
              {AZ_COPY.listingForm.photos}
            </legend>
            <p className="mt-2 text-[10px] leading-5 text-gray-500">
              {AZ_COPY.listingForm.photosEditBody}
            </p>
            <div
              className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
              aria-label={AZ_COPY.listingForm.listingPhotos}
            >
              {existingImages.map((url, index) => (
                <ImagePreview
                  key={url}
                  url={url}
                  alt={`${AZ_COPY.listingForm.currentPhoto} ${index + 1}`}
                  removeLabel={`${AZ_COPY.listingForm.removeCurrentPhoto} ${index + 1}`}
                  onRemove={() => {
                    setSaved(false);
                    setListing({
                      ...listing,
                      images: existingImages.filter((image) => image !== url),
                    });
                  }}
                />
              ))}
              {previewUrls.map((url, index) => (
                <ImagePreview
                  key={url}
                  url={url}
                  alt={`${AZ_COPY.listingForm.newPhoto} ${index + 1}`}
                  removeLabel={`${AZ_COPY.listingForm.removeNewPhoto} ${index + 1}`}
                  onRemove={() =>
                    setFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                />
              ))}
            </div>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#bfae8d] bg-[#fffaf0]/55 px-4 text-[10px] font-bold">
              <ImagePlus size={15} className="text-orange" />
              {AZ_COPY.listingForm.addReplacementPhotos}
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={chooseImages}
              />
            </label>
          </fieldset>

          {error && (
            <p role="alert" className="text-[10px] text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p
              role="status"
              className="flex items-center gap-2 text-[10px] text-emerald-700"
            >
              <Check size={12} /> {AZ_COPY.listingForm.saved}
            </p>
          )}
          {cleanupPending && (
            <p role="status" className="text-[10px] text-amber-700">
              {AZ_COPY.listingForm.cleanupPending}
            </p>
          )}
          <button disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? AZ_COPY.listingForm.saving : AZ_COPY.listingForm.save}
          </button>
        </form>
      </div>
    </div>
  );
}

function ImagePreview({
  url,
  alt,
  removeLabel,
  onRemove,
}: {
  url: string;
  alt: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[#ded4c1] bg-[#fffaf0]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-ink text-white shadow"
        aria-label={removeLabel}
      >
        <X size={14} />
      </button>
    </div>
  );
}
