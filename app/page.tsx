"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookCopy,
  BookOpen,
  GraduationCap,
  NotebookPen,
  Search,
  Sparkles,
} from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { BookSkeleton } from "@/components/book-skeleton";
import { EmptyState } from "@/components/empty-state";
import { MotionReveal } from "@/components/motion-reveal";
import { useListings } from "@/hooks/use-listings";
import { AZ_COPY, formatCategory } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

const displayBooks: Listing[] = [
  {
    id: "visual-1",
    title: "Seçilmiş esselər",
    author: "Oxu klubu",
    description: "",
    price: 0,
    category: "Essays",
    condition: "Like new",
    city: "",
    status: "active",
    seller: { id: "", name: "" },
    color: "#203a33",
    accent: "#d6b35d",
  },
  {
    id: "visual-2",
    title: "Fikirlər tarixi",
    author: "Şəxsi kitabxana",
    description: "",
    price: 0,
    category: "History",
    condition: "Like new",
    city: "",
    status: "active",
    seller: { id: "", name: "" },
    color: "#6a3327",
    accent: "#e6cb8a",
  },
  {
    id: "visual-3",
    title: "Müasir ədəbiyyat",
    author: "BookSwap nəşri",
    description: "",
    price: 0,
    category: "Fiction",
    condition: "Like new",
    city: "",
    status: "active",
    seller: { id: "", name: "" },
    color: "#302a41",
    accent: "#d8c18d",
  },
  {
    id: "visual-4",
    title: "İmtahan qeydləri",
    author: "Tələbə arxivi",
    description: "",
    price: 0,
    category: "Notes",
    condition: "Good",
    city: "",
    status: "active",
    seller: { id: "", name: "" },
    color: "#866b28",
    accent: "#fff0bd",
  },
  {
    id: "visual-5",
    title: "Nadir şeirlər",
    author: "İçərişəhər kitabları",
    description: "",
    price: 0,
    category: "Rare Finds",
    condition: "Good",
    city: "",
    status: "active",
    seller: { id: "", name: "" },
    color: "#75392f",
    accent: "#e6c887",
  },
];

const quickCategories = [
  ["Textbooks", GraduationCap],
  ["Fiction", BookOpen],
  ["Exam Prep", NotebookPen],
  ["Notes", BookCopy],
  ["Rare Finds", Sparkles],
] as const;

export default function HomePage() {
  const { data, loading, error } = useListings();
  const featured = data.slice(0, 4);
  const recent = data.slice(4, 8);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#cdbd9e] pt-14 md:pt-20">
        <div className="container-shell relative z-10 text-center">
          <MotionReveal>
            <span className="bookmark-badge">{AZ_COPY.home.badge}</span>
            <h1 className="display mx-auto mt-7 max-w-5xl break-words text-[56px] font-semibold leading-[.94] [overflow-wrap:anywhere] md:text-[92px]">
              {AZ_COPY.home.heroLead}
              <br />
              <span className="text-orange">{AZ_COPY.home.heroAccent}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#6c6253]">
              {AZ_COPY.home.intro}
            </p>
          </MotionReveal>

          <MotionReveal delay={0.08} className="mx-auto mt-9 max-w-4xl">
            <form
              action="/listings"
              className="catalog-drawer flex flex-col gap-2 rounded-md p-3 sm:flex-row"
            >
              <label className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-orange"
                />
                <input
                  name="query"
                  className="input !min-h-[58px] !border-0 !bg-transparent !pl-14 !text-sm !shadow-none"
                  placeholder={AZ_COPY.home.searchPlaceholder}
                  aria-label={AZ_COPY.home.searchLabel}
                />
              </label>
              <button className="btn-primary !min-h-[58px] !px-8">
                {AZ_COPY.home.searchAction} <ArrowRight size={15} />
              </button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {quickCategories.map(([category, Icon]) => (
                <Link
                  key={category}
                  href={`/listings?category=${encodeURIComponent(category)}`}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-[#95866f] bg-[#fffaf0]/65 px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5 hover:border-orange"
                >
                  <Icon size={13} className="text-orange" />{" "}
                  {formatCategory(category)}
                </Link>
              ))}
            </div>
          </MotionReveal>
        </div>

        <div className="desk-surface relative mt-16 min-h-[250px] border-y border-[#261a11]">
          <div className="container-shell relative flex min-h-[250px] items-end justify-center gap-3 overflow-hidden px-5 pt-10">
            {displayBooks.map((book, index) => (
              <MotionReveal
                key={book.id}
                delay={index * 0.06}
                className={`w-[105px] shrink-0 origin-bottom sm:w-[135px] md:w-[165px] ${index % 2 ? "translate-y-5 rotate-2" : "-rotate-2"}`}
              >
                <BookCover listing={book} />
              </MotionReveal>
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-[#89623b] to-[#392518] shadow-[0_-8px_30px_rgba(0,0,0,.25)]" />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-shell">
          <MarketplaceHeading
            label={AZ_COPY.home.featuredLabel}
            title={AZ_COPY.home.featuredTitle}
            link="/listings"
          />
          {loading ? (
            <SkeletonShelf />
          ) : featured.length ? (
            <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {featured.map((listing) => (
                <BookCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </section>

      <section className="border-y border-[#cdbd9e] bg-[#ebe1d0] py-16">
        <div className="container-shell">
          <div className="flex min-w-0 flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="min-w-0">
              <span className="eyebrow">{AZ_COPY.home.browseLabel}</span>
              <h2 className="display mt-3 break-words text-4xl font-semibold [overflow-wrap:anywhere] md:text-5xl">
                {AZ_COPY.home.browseTitle}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted">
              {AZ_COPY.home.browseBody}
            </p>
          </div>
          <div className="mt-9 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-5">
            {quickCategories.map(([category, Icon], index) => (
              <Link
                key={category}
                href={`/listings?category=${encodeURIComponent(category)}`}
                className="catalog-drawer group relative min-h-[150px] min-w-0 overflow-hidden rounded-sm p-5 transition hover:-translate-y-1"
              >
                <span className="display absolute right-3 top-3 text-4xl text-[#d8c6a5]">
                  0{index + 1}
                </span>
                <Icon size={19} className="text-orange" />
                <h3 className="display mt-12 break-words text-2xl font-semibold [overflow-wrap:anywhere]">
                  {formatCategory(category)}
                </h3>
                <span className="mt-2 flex min-h-6 items-center gap-1 text-xs font-bold text-muted">
                  {AZ_COPY.home.openShelf} <ArrowRight size={11} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-shell">
          <MarketplaceHeading
            label={AZ_COPY.home.recentLabel}
            title={AZ_COPY.home.recentTitle}
            link="/listings"
          />
          {loading ? (
            <SkeletonShelf />
          ) : recent.length ? (
            <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {recent.map((listing) => (
                <BookCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : data.length ? (
            <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {featured.map((listing) => (
                <BookCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-shell pb-24">
        <div className="desk-surface relative overflow-hidden rounded-md border border-[#24170f] px-7 py-14 text-[#fff8e9] md:px-14">
          <div className="absolute bottom-0 right-[8%] hidden md:block">
            <div className="spine-stack">
              {displayBooks.map((book, index) => (
                <span
                  key={book.id}
                  className="spine"
                  style={
                    {
                      "--spine-color": book.color,
                      height: `${135 + index * 9}px`,
                    } as React.CSSProperties
                  }
                >
                  {book.title}
                </span>
              ))}
            </div>
          </div>
          <div className="relative max-w-xl">
            <span className="bookmark-badge">{AZ_COPY.home.sellerBadge}</span>
            <h2 className="display mt-5 break-words text-5xl font-semibold leading-none [overflow-wrap:anywhere]">
              {AZ_COPY.home.sellerTitleLead}
              <br />
              {AZ_COPY.home.sellerTitleAccent}
            </h2>
            <p className="mt-5 text-xs leading-7 text-[#d7c5aa]">
              {AZ_COPY.home.sellerBody}
            </p>
            <Link href="/listings/new" className="btn-primary mt-7">
              {AZ_COPY.home.sellBook} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function MarketplaceHeading({
  label,
  title,
  link,
}: {
  label: string;
  title: string;
  link: string;
}) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-5 border-b border-[#cdbd9e] pb-5">
      <div className="min-w-0">
        <span className="eyebrow">{label}</span>
        <h2 className="display mt-3 break-words text-4xl font-semibold [overflow-wrap:anywhere] md:text-5xl">
          {title}
        </h2>
      </div>
      <Link
        href={link}
        className="hide-mobile flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-orange"
      >
        {AZ_COPY.home.viewAll} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function SkeletonShelf() {
  return (
    <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-5 md:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <BookSkeleton key={item} />
      ))}
    </div>
  );
}
