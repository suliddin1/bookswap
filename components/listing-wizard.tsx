"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  ShieldCheck,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/client-api";
import { BookCover } from "@/components/book-cover";
import type { Listing } from "@/lib/types";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "@/lib/marketplace";
import {
  cleanupUploadedListingImages,
  uploadListingImages,
  validateListingImageFiles,
} from "@/lib/client-listing-images";
import {
  AZ_COPY,
  formatAzn,
  formatCategory,
  formatCity,
  formatCondition,
  localizeApiError,
} from "@/lib/i18n";
import type { ChangeEvent } from "react";

const steps = AZ_COPY.listingForm.steps;
const initial = {
  title: "",
  author: "",
  isbn: "",
  category: "Fiction",
  city: "Baku",
  description: "",
  condition: "Very good",
  price: "",
};

export function ListingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const validationError = validateListingImageFiles(selected);
    if (validationError) {
      setFiles([]);
      setError(validationError);
      event.target.value = "";
      return;
    }
    setError("");
    setFiles(selected);
    event.target.value = "";
  }
  function removeImage(index: number) {
    setFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }
  function canContinue() {
    if (step === 0)
      return (
        form.title.length > 1 &&
        form.author.length > 1 &&
        form.description.length >= 10
      );
    if (step === 2) return Number(form.price) > 0 && files.length > 0;
    return true;
  }

  async function publish() {
    setBusy(true);
    setError("");
    let uploadedImages: string[] = [];
    try {
      uploadedImages = await uploadListingImages(files);
      const response = await authFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          images: uploadedImages,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.listingForm.publishFailed),
        );
      setComplete(true);
      setFiles([]);
    } catch (reason) {
      let message =
        reason instanceof Error
          ? reason.message
          : AZ_COPY.listingForm.publishFailed;
      if (uploadedImages.length) {
        try {
          await cleanupUploadedListingImages(uploadedImages);
        } catch {
          message += ` ${AZ_COPY.listingForm.cleanupQueued}`;
        }
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const preview: Listing = {
    id: "preview",
    title: form.title || AZ_COPY.listingForm.previewTitle,
    author: form.author || AZ_COPY.listingForm.previewAuthor,
    description: form.description,
    price: Number(form.price) || 0,
    category: form.category,
    condition: form.condition,
    city: form.city,
    status: "active",
    seller: { id: "", name: "" },
    color: "#243a31",
    accent: "#d7b764",
    images: previewUrls.slice(0, 1),
  };

  if (complete)
    return (
      <div className="container-shell grid min-h-[650px] place-items-center py-16">
        <div className="card max-w-lg p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eee3c8] text-orange">
            <Check size={28} />
          </span>
          <h1 className="display mt-6 text-4xl font-semibold">
            {AZ_COPY.listingForm.publishedTitle}
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-500">
            {AZ_COPY.listingForm.publishedBody}
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/profile" className="btn-secondary">
              {AZ_COPY.listingForm.myShelf}
            </Link>
            <Link href="/listings" className="btn-primary">
              {AZ_COPY.listingForm.browseBooks}
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-[10px] font-bold text-gray-500"
          >
            <X size={14} /> {AZ_COPY.listingForm.cancel}
          </Link>
          <span className="text-[9px] text-gray-400">
            {AZ_COPY.listingForm.secureListing}
          </span>
        </div>
        <div className="mt-10 text-center">
          <span className="eyebrow">{AZ_COPY.listingForm.badge}</span>
          <h1 className="display mt-4 text-5xl font-semibold">
            {AZ_COPY.listingForm.title}
          </h1>
          <p className="mt-3 text-xs text-gray-500">
            {AZ_COPY.listingForm.intro}
          </p>
        </div>
        <div className="mt-10 flex items-center justify-between">
          {steps.map((item, index) => (
            <div key={item} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  aria-current={index === step ? "step" : undefined}
                  className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold ${index <= step ? "border-orange bg-orange text-white" : "border-[#d8cbb5] bg-[#fffaf0]"}`}
                >
                  {index < step ? <Check size={13} /> : index + 1}
                </span>
                <span
                  className={`hide-mobile text-[9px] font-bold ${index === step ? "text-ink" : "text-gray-400"}`}
                >
                  {item}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`mx-3 h-px flex-1 ${index < step ? "bg-orange" : "bg-[#d8cbb5]"}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="card mt-10 p-6 md:p-10">
          {step === 0 && (
            <div>
              <Heading
                title={AZ_COPY.listingForm.detailsTitle}
                body={AZ_COPY.listingForm.detailsBody}
              />
              <div className="mt-7 grid gap-5">
                <Field
                  label={AZ_COPY.listingForm.isbn}
                  value={form.isbn}
                  setValue={(v) => update("isbn", v)}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label={AZ_COPY.listingForm.bookTitle}
                    value={form.title}
                    setValue={(v) => update("title", v)}
                  />
                  <Field
                    label={AZ_COPY.listingForm.author}
                    value={form.author}
                    setValue={(v) => update("author", v)}
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Select
                    label={AZ_COPY.listingForm.category}
                    value={form.category}
                    setValue={(v) => update("category", v)}
                    options={[...BOOK_CATEGORIES]}
                    formatOption={formatCategory}
                  />
                  <Select
                    label={AZ_COPY.listingForm.location}
                    value={form.city}
                    setValue={(v) => update("city", v)}
                    options={[...AZERBAIJAN_CITIES]}
                    formatOption={formatCity}
                  />
                </div>
                <label>
                  <Label>{AZ_COPY.listingForm.description}</Label>
                  <textarea
                    className="input min-h-[130px] resize-none py-3"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder={AZ_COPY.listingForm.descriptionPlaceholder}
                  />
                </label>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <Heading
                title={AZ_COPY.listingForm.conditionTitle}
                body={AZ_COPY.listingForm.conditionBody}
              />
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {BOOK_CONDITIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => update("condition", item)}
                    aria-pressed={form.condition === item}
                    className={`rounded-xl border p-5 text-left text-xs font-bold transition ${form.condition === item ? "border-orange bg-[#f4ead2]" : "border-[#ded4c1]"}`}
                  >
                    {formatCondition(item)}
                    {form.condition === item && (
                      <Check size={14} className="float-right text-orange" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <Heading
                title={AZ_COPY.listingForm.photosTitle}
                body={AZ_COPY.listingForm.photosBody}
              />
              <label className="mt-7 grid min-h-[180px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#bfae8d] bg-[#fffaf0]/55 text-center">
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={chooseImages}
                />
                <span>
                  <ImagePlus size={24} className="mx-auto text-orange" />
                  <b className="mt-3 block text-xs">
                    {AZ_COPY.listingForm.choosePhotos}
                  </b>
                  <span className="mt-2 block text-[9px] text-gray-500">
                    {files.length
                      ? AZ_COPY.listingForm.selectedCount(files.length)
                      : AZ_COPY.listingForm.photosHint}
                  </span>
                </span>
              </label>
              {previewUrls.length > 0 && (
                <div
                  className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
                  aria-label={AZ_COPY.listingForm.selectedPhotos}
                >
                  {previewUrls.map((url, index) => (
                    <div
                      key={url}
                      className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[#ded4c1] bg-[#fffaf0]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${AZ_COPY.listingForm.selectedPhoto} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-ink text-white shadow"
                        aria-label={`${AZ_COPY.listingForm.removeSelectedPhoto} ${index + 1}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Field
                  label={AZ_COPY.listingForm.price}
                  value={form.price}
                  setValue={(v) => update("price", v)}
                  type="number"
                />
              </div>
              <p className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
                <ShieldCheck size={13} className="text-orange" />
                {AZ_COPY.listingForm.protectedUpload}
              </p>
            </div>
          )}
          {step === 3 && (
            <div>
              <Heading
                title={AZ_COPY.listingForm.reviewTitle}
                body={AZ_COPY.listingForm.reviewBody}
              />
              <div className="mx-auto mt-7 grid max-w-md gap-5 rounded-xl border border-[#ded4c1] p-6 sm:grid-cols-[120px_1fr]">
                <BookCover listing={preview} />
                <div>
                  <span className="pill">{AZ_COPY.listingForm.preview}</span>
                  <h3 className="display mt-4 text-2xl font-semibold">
                    {preview.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{preview.author}</p>
                  <strong className="display mt-6 block text-2xl text-orange">
                    {formatAzn(preview.price)}
                  </strong>
                </div>
              </div>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-red-50 p-3 text-[10px] text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <button
            className="btn-ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={15} /> {AZ_COPY.listingForm.back}
          </button>
          <button
            disabled={!canContinue() || busy}
            className="btn-primary disabled:opacity-50"
            onClick={() => (step === 3 ? publish() : setStep(step + 1))}
          >
            {busy
              ? AZ_COPY.listingForm.publishing
              : step === 3
                ? AZ_COPY.listingForm.publish
                : AZ_COPY.listingForm.continue}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="display text-3xl font-semibold">{title}</h2>
      <p className="mt-2 text-xs text-gray-500">{body}</p>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
      {children}
    </span>
  );
}
function Field({
  label,
  value,
  setValue,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  setValue,
  options,
  formatOption,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  formatOption: (value: string) => string;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <select
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {formatOption(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
