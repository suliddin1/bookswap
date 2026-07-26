"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  ShieldCheck,
  X,
} from "lucide-react";
import { authFetch, LocalizedClientError } from "@/lib/client-api";
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
  getResponseErrorCode,
  parseListingDataResponse,
  readResponseJson,
} from "@/lib/listing-authoring-responses";
import {
  AZ_COPY,
  formatAzn,
  formatCategory,
  formatCity,
  formatCondition,
  localizeApiError,
} from "@/lib/i18n";
import type { ChangeEvent, RefObject } from "react";

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
  const [invalidField, setInvalidField] = useState<
    "title" | "author" | "description" | "files" | "price" | null
  >(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const completeHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    if (previousStepRef.current !== step) {
      previousStepRef.current = step;
      stepHeadingRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (!error) return;
    const fieldRefs = {
      title: titleRef,
      author: authorRef,
      description: descriptionRef,
      files: fileRef,
      price: priceRef,
    };
    if (invalidField) fieldRefs[invalidField].current?.focus();
    else errorRef.current?.focus();
  }, [error, invalidField]);

  useEffect(() => {
    if (complete) completeHeadingRef.current?.focus();
  }, [complete]);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (invalidField === key) {
      setInvalidField(null);
      setError("");
    }
  }
  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const validationError = validateListingImageFiles(selected);
    if (validationError) {
      setFiles([]);
      setInvalidField("files");
      setError(validationError);
      event.target.value = "";
      return;
    }
    setInvalidField(null);
    setError("");
    setFiles(selected);
    event.target.value = "";
  }
  function removeImage(index: number) {
    setFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }
  function showValidationError(
    message: string,
    field: Exclude<typeof invalidField, null>,
  ) {
    setInvalidField(field);
    setError(message);
    const fieldRefs = {
      title: titleRef,
      author: authorRef,
      description: descriptionRef,
      files: fileRef,
      price: priceRef,
    };
    requestAnimationFrame(() => fieldRefs[field].current?.focus());
  }

  function advance() {
    if (step === 0) {
      if (form.title.trim().length < 2)
        return showValidationError(AZ_COPY.listingForm.titleRequired, "title");
      if (form.author.trim().length < 2)
        return showValidationError(
          AZ_COPY.listingForm.authorRequired,
          "author",
        );
      if (form.description.trim().length < 10)
        return showValidationError(
          AZ_COPY.listingForm.descriptionMinimum,
          "description",
        );
    }
    if (step === 2) {
      if (!files.length)
        return showValidationError(
          AZ_COPY.listingForm.atLeastOnePhoto,
          "files",
        );
      if (Number(form.price) <= 0)
        return showValidationError(AZ_COPY.listingForm.pricePositive, "price");
    }
    setError("");
    setInvalidField(null);
    setStep(step + 1);
  }

  async function publish() {
    setBusy(true);
    setError("");
    setInvalidField(null);
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
      const body = await readResponseJson(response);
      if (!response.ok)
        throw new LocalizedClientError(
          localizeApiError(
            getResponseErrorCode(body),
            AZ_COPY.listingForm.publishFailed,
          ),
        );
      if (!parseListingDataResponse(body))
        throw new LocalizedClientError(AZ_COPY.listingForm.publishFailed);
      setComplete(true);
      setFiles([]);
    } catch (reason) {
      let message =
        reason instanceof LocalizedClientError
          ? reason.message
          : AZ_COPY.listingForm.publishFailed;
      if (uploadedImages.length) {
        try {
          await cleanupUploadedListingImages(uploadedImages);
        } catch {
          message += ` ${AZ_COPY.listingForm.cleanupFailed}`;
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
        <div className="card min-w-0 max-w-lg p-5 text-center sm:p-10">
          <span
            aria-hidden="true"
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eee3c8] text-orange"
          >
            <Check size={28} />
          </span>
          <h1
            ref={completeHeadingRef}
            tabIndex={-1}
            className="display mt-6 break-words text-3xl font-semibold sm:text-4xl"
          >
            {AZ_COPY.listingForm.publishedTitle}
          </h1>
          <p className="mt-4 break-words text-sm leading-7 text-muted">
            {AZ_COPY.listingForm.publishedBody}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/profile" className="btn-secondary min-w-0">
              {AZ_COPY.listingForm.myShelf}
            </Link>
            <Link href="/listings" className="btn-primary min-w-0">
              {AZ_COPY.listingForm.browseBooks}
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-muted hover:text-orange"
          >
            <X size={14} /> {AZ_COPY.listingForm.cancel}
          </Link>
          <span className="text-xs text-muted">
            {AZ_COPY.listingForm.secureListing}
          </span>
        </div>
        <div className="mt-10 text-center">
          <span className="eyebrow">{AZ_COPY.listingForm.badge}</span>
          <h1 className="display mt-4 break-words text-4xl font-semibold sm:text-5xl">
            {AZ_COPY.listingForm.title}
          </h1>
          <p className="mt-3 text-sm text-muted">{AZ_COPY.listingForm.intro}</p>
        </div>
        <ol
          aria-label={AZ_COPY.listingForm.progressLabel}
          className="mt-10 flex items-center justify-between"
        >
          {steps.map((item, index) => (
            <li
              key={item}
              className="flex min-w-0 flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  aria-current={index === step ? "step" : undefined}
                  aria-label={AZ_COPY.listingForm.stepLabel(
                    index + 1,
                    steps.length,
                    item,
                  )}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${index <= step ? "border-orange bg-orange text-white" : "border-line bg-[#fffaf0]"}`}
                >
                  {index < step ? (
                    <Check aria-hidden="true" size={13} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`hide-mobile text-xs font-bold ${index === step ? "text-ink" : "text-muted"}`}
                >
                  {item}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-1 h-px min-w-0 flex-1 sm:mx-3 ${index < step ? "bg-orange" : "bg-line"}`}
                />
              )}
            </li>
          ))}
        </ol>
        <div
          aria-busy={busy}
          aria-labelledby="listing-step-heading"
          className="card mt-10 p-5 sm:p-6 md:p-10"
        >
          {step === 0 && (
            <section aria-labelledby="listing-step-heading">
              <Heading
                headingRef={stepHeadingRef}
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
                    inputRef={titleRef}
                    required
                    minLength={2}
                    invalid={invalidField === "title"}
                  />
                  <Field
                    label={AZ_COPY.listingForm.author}
                    value={form.author}
                    setValue={(v) => update("author", v)}
                    inputRef={authorRef}
                    required
                    minLength={2}
                    invalid={invalidField === "author"}
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
                    ref={descriptionRef}
                    required
                    minLength={10}
                    className="input min-h-[130px] resize-none py-3"
                    aria-invalid={invalidField === "description"}
                    aria-describedby={
                      invalidField === "description"
                        ? "listing-form-error"
                        : undefined
                    }
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder={AZ_COPY.listingForm.descriptionPlaceholder}
                  />
                </label>
              </div>
            </section>
          )}
          {step === 1 && (
            <section aria-labelledby="listing-step-heading">
              <Heading
                headingRef={stepHeadingRef}
                title={AZ_COPY.listingForm.conditionTitle}
                body={AZ_COPY.listingForm.conditionBody}
              />
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {BOOK_CONDITIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => update("condition", item)}
                    aria-pressed={form.condition === item}
                    className={`min-h-11 rounded-xl border p-5 text-left text-sm font-bold transition ${form.condition === item ? "border-orange bg-[#f4ead2]" : "border-line"}`}
                  >
                    {formatCondition(item)}
                    {form.condition === item && (
                      <Check size={14} className="float-right text-orange" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
          {step === 2 && (
            <section aria-labelledby="listing-step-heading">
              <Heading
                headingRef={stepHeadingRef}
                title={AZ_COPY.listingForm.photosTitle}
                body={AZ_COPY.listingForm.photosBody}
              />
              <label className="file-input-control mt-7 grid min-h-[180px] cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-[#fffaf0]/55 p-4 text-center">
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  aria-label={AZ_COPY.listingForm.choosePhotos}
                  aria-describedby={
                    invalidField === "files"
                      ? "listing-photo-hint listing-form-error"
                      : "listing-photo-hint"
                  }
                  aria-invalid={invalidField === "files"}
                  ref={fileRef}
                  onChange={chooseImages}
                />
                <span>
                  <ImagePlus size={24} className="mx-auto text-orange" />
                  <b className="mt-3 block text-xs">
                    {AZ_COPY.listingForm.choosePhotos}
                  </b>
                  <span
                    id="listing-photo-hint"
                    className="mt-2 block text-xs leading-5 text-muted"
                  >
                    {files.length
                      ? AZ_COPY.listingForm.selectedCount(files.length)
                      : AZ_COPY.listingForm.photosHint}
                  </span>
                </span>
              </label>
              {previewUrls.length > 0 && (
                <div
                  className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
                  role="group"
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
                        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow"
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
                  inputRef={priceRef}
                  required
                  min="0.01"
                  step="0.01"
                  invalid={invalidField === "price"}
                />
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                <ShieldCheck size={13} className="text-orange" />
                {AZ_COPY.listingForm.protectedUpload}
              </p>
            </section>
          )}
          {step === 3 && (
            <section aria-labelledby="listing-step-heading">
              <Heading
                headingRef={stepHeadingRef}
                title={AZ_COPY.listingForm.reviewTitle}
                body={AZ_COPY.listingForm.reviewBody}
              />
              <div className="mx-auto mt-7 grid min-w-0 max-w-md gap-5 rounded-xl border border-[#ded4c1] p-6 sm:grid-cols-[120px_1fr]">
                <BookCover listing={preview} />
                <div className="min-w-0">
                  <span className="pill">{AZ_COPY.listingForm.preview}</span>
                  <h3 className="display mt-4 break-words text-2xl font-semibold">
                    {preview.title}
                  </h3>
                  <p className="mt-1 break-words text-sm text-muted">
                    {preview.author}
                  </p>
                  <strong className="display mt-6 block text-2xl text-orange">
                    {formatAzn(preview.price)}
                  </strong>
                </div>
              </div>
            </section>
          )}
          {error && (
            <p
              ref={errorRef}
              id="listing-form-error"
              role="alert"
              tabIndex={-1}
              className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        {busy && (
          <p className="sr-only" role="status">
            {AZ_COPY.listingForm.publishing}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setError("");
              setInvalidField(null);
              setStep(Math.max(0, step - 1));
            }}
            disabled={step === 0}
          >
            <ArrowLeft size={15} /> {AZ_COPY.listingForm.back}
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn-primary disabled:opacity-50"
            onClick={() => (step === 3 ? publish() : advance())}
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

function Heading({
  title,
  body,
  headingRef,
}: {
  title: string;
  body: string;
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  return (
    <div>
      <h2
        id="listing-step-heading"
        ref={headingRef}
        tabIndex={-1}
        className="display break-words text-3xl font-semibold"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block break-words text-xs font-extrabold uppercase tracking-[.13em] text-muted">
      {children}
    </span>
  );
}
function Field({
  label,
  value,
  setValue,
  type = "text",
  inputRef,
  required,
  minLength,
  min,
  step,
  invalid = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: string;
  inputRef?: RefObject<HTMLInputElement>;
  required?: boolean;
  minLength?: number;
  min?: string;
  step?: string;
  invalid?: boolean;
}) {
  return (
    <label>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        className="input"
        type={type}
        required={required}
        minLength={minLength}
        min={min}
        step={step}
        aria-invalid={invalid}
        aria-describedby={invalid ? "listing-form-error" : undefined}
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
