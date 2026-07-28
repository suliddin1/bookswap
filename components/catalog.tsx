"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { BookOpen, ChevronDown, MapPin, Search, Tag, X } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookSkeleton } from "@/components/book-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useListings } from "@/hooks/use-listings";
import {
  AZ_COPY,
  formatAzn,
  formatCategory,
  formatCity,
  formatCondition,
} from "@/lib/i18n";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "@/lib/marketplace";

const ALL_BOOKS_VALUE = "All books";
const categories = [ALL_BOOKS_VALUE, ...BOOK_CATEGORIES];

export function Catalog({
  initialCategory = ALL_BOOKS_VALUE,
  initialQuery = "",
  initialCity = "",
  initialCondition = "",
  initialMaxPrice = 200,
  initialSort = "newest",
}: {
  initialCategory?: string;
  initialQuery?: string;
  initialCity?: string;
  initialCondition?: string;
  initialMaxPrice?: number;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [condition, setCondition] = useState(initialCondition);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);
  const deferredQuery = useDeferredValue(query);
  const { data, loading, loadingMore, error, hasMore, loadMore } = useListings({
    query: deferredQuery,
    category: category === ALL_BOOKS_VALUE ? "" : category,
    city,
    condition,
    maxPrice,
    sort,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category !== ALL_BOOKS_VALUE) params.set("category", category);
    if (city) params.set("city", city);
    if (condition) params.set("condition", condition);
    if (maxPrice !== 200) params.set("maxPrice", String(maxPrice));
    if (sort !== "newest") params.set("sort", sort);
    window.history.replaceState(
      null,
      "",
      `/listings${params.size ? `?${params}` : ""}`,
    );
  }, [query, category, city, condition, maxPrice, sort]);

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="flex min-w-0 flex-col justify-between gap-6 border-b-2 border-[#5b3c25] pb-7 md:flex-row md:items-end">
        <div className="min-w-0">
          <span className="bookmark-badge">{AZ_COPY.catalog.badge}</span>
          <h1 className="display mt-5 break-words text-5xl font-semibold md:text-7xl">
            {AZ_COPY.catalog.title}
          </h1>
        </div>
        <p className="max-w-sm text-xs leading-7 text-muted">
          {AZ_COPY.catalog.intro}
        </p>
      </div>

      <section
        aria-labelledby="catalog-filter-heading"
        className="catalog-drawer mt-7 rounded-sm p-4 md:p-5"
      >
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-4 border-b border-[#95866f] pb-3">
          <h2
            id="catalog-filter-heading"
            className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em]"
          >
            <BookOpen size={13} className="text-orange" />{" "}
            {AZ_COPY.catalog.searchCard}
          </h2>
          <span className="min-w-0 break-words text-xs text-muted">
            {AZ_COPY.catalog.availableCopies}
          </span>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-[1.4fr_.7fr_.7fr_.6fr]">
          <CatalogField label={AZ_COPY.catalog.titleAuthorIsbn}>
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-orange"
                size={14}
              />
              <input
                className="input !min-h-11 !pl-9 !pr-11"
                placeholder={AZ_COPY.catalog.searchPlaceholder}
                aria-label={AZ_COPY.catalog.searchLabel}
                maxLength={200}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg"
                  aria-label={AZ_COPY.catalog.clearSearch}
                >
                  <X size={13} />
                </button>
              )}
            </label>
          </CatalogField>
          <CatalogField label={AZ_COPY.catalog.location}>
            <Select
              label={AZ_COPY.catalog.locationFilter}
              value={city}
              onChange={setCity}
              options={[
                ["", AZ_COPY.catalog.anywhere],
                ...AZERBAIJAN_CITIES.map(
                  (item) => [item, formatCity(item)] as [string, string],
                ),
              ]}
              icon={MapPin}
            />
          </CatalogField>
          <CatalogField label={AZ_COPY.catalog.condition}>
            <Select
              label={AZ_COPY.catalog.conditionFilter}
              value={condition}
              onChange={setCondition}
              options={[
                ["", AZ_COPY.catalog.anyCondition],
                ...BOOK_CONDITIONS.map(
                  (item) => [item, formatCondition(item)] as [string, string],
                ),
              ]}
              icon={Tag}
            />
          </CatalogField>
          <CatalogField label={AZ_COPY.catalog.maximumPrice}>
            <div className="pt-1">
              <input
                className="h-11 w-full accent-orange"
                type="range"
                min="5"
                max="200"
                step="1"
                value={maxPrice}
                aria-label={AZ_COPY.catalog.maximumPriceLabel}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
              />
              <span className="mt-1 block text-center text-xs font-bold">
                {formatAzn(maxPrice)}-dək
              </span>
            </div>
          </CatalogField>
        </div>
      </section>

      <div className="mt-9 grid min-w-0 gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="min-w-0" aria-labelledby="catalog-category-heading">
          <h2
            id="catalog-category-heading"
            className="border-b-2 border-[#5b3c25] pb-3 text-xs font-extrabold uppercase tracking-[.16em]"
          >
            {AZ_COPY.catalog.subjectIndex}
          </h2>
          <div className="mt-2 divide-y divide-[#95866f] border-b border-[#95866f]">
            {categories.map((item, index) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-3 py-3 text-left text-xs font-bold transition ${category === item ? "text-orange" : "text-gray-600 hover:pl-1 hover:text-ink"}`}
              >
                <span className="min-w-0 break-words">
                  {item === ALL_BOOKS_VALUE
                    ? AZ_COPY.catalog.allBooks
                    : formatCategory(item)}
                </span>
                <span className="display shrink-0 text-sm text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-7 border-l-2 border-orange pl-4">
            <b className="display text-xl">{AZ_COPY.catalog.readerListed}</b>
            <p className="mt-2 text-xs leading-5 text-muted">
              {AZ_COPY.catalog.readerListedBody}
            </p>
          </div>
        </aside>

        <section
          aria-labelledby="catalog-results-heading"
          aria-busy={loading || loadingMore}
          className="min-w-0"
        >
          <div className="mb-6 flex flex-col items-start justify-between gap-2 border-b border-[#95866f] pb-3 sm:flex-row sm:items-center">
            <h2
              id="catalog-results-heading"
              aria-live="polite"
              className="text-xs font-bold uppercase tracking-[.14em]"
            >
              {data.length} kataloq nəticəsi yüklənib
            </h2>
            <label className="relative block w-full min-w-0 sm:w-auto">
              <span className="sr-only">{AZ_COPY.catalog.sortLabel}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-h-11 w-full max-w-full appearance-none bg-transparent pr-6 text-xs font-bold uppercase tracking-[.1em]"
              >
                <option value="newest">{AZ_COPY.catalog.newest}</option>
                <option value="price-low">{AZ_COPY.catalog.lowestPrice}</option>
                <option value="price-high">
                  {AZ_COPY.catalog.highestPrice}
                </option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
              />
            </label>
          </div>
          {loading ? (
            <div className="shelf-row grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                <BookSkeleton key={item} />
              ))}
            </div>
          ) : data.length ? (
            <>
              <div className="shelf-row grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 xl:grid-cols-4">
                {data.map((listing) => (
                  <BookCard key={listing.id} listing={listing} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-12 flex justify-center">
                  <button
                    className="btn-secondary"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? AZ_COPY.catalog.loadingMore
                      : AZ_COPY.catalog.loadMore}
                  </button>
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="mt-5 text-center text-xs text-red-700"
                >
                  {AZ_COPY.global.loadMoreUnavailable}
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title={AZ_COPY.catalog.emptyTitle}
              body={
                error
                  ? AZ_COPY.global.listingsUnavailable
                  : AZ_COPY.catalog.emptyBody
              }
              action={AZ_COPY.catalog.sellBook}
              href="/listings/new"
            />
          )}
        </section>
      </div>
    </div>
  );
}

function CatalogField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="mb-2 block break-words text-xs font-extrabold uppercase tracking-[.13em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  icon: typeof MapPin;
}) {
  return (
    <label className="relative block min-w-0">
      <Icon
        size={12}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange"
      />
      <select
        className="input !min-h-11 min-w-0 appearance-none !pl-8 !pr-8 text-xs"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([id, label]) => (
          <option value={id} key={id}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
      />
    </label>
  );
}
