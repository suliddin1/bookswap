"use client";

import Link from "next/link";
import { ArrowRight, BookCopy, BookOpen, GraduationCap, NotebookPen, Search, Sparkles } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { BookSkeleton } from "@/components/book-skeleton";
import { EmptyState } from "@/components/empty-state";
import { MotionReveal } from "@/components/motion-reveal";
import { useListings } from "@/hooks/use-listings";
import type { Listing } from "@/lib/types";

const displayBooks: Listing[] = [
  { id: "visual-1", title: "Collected Essays", author: "The Reading Club", description: "", price: 0, category: "Essays", condition: "Like new", city: "", status: "active", seller: { id: "", name: "" }, color: "#203a33", accent: "#d6b35d" },
  { id: "visual-2", title: "A History of Ideas", author: "Private Library", description: "", price: 0, category: "History", condition: "Like new", city: "", status: "active", seller: { id: "", name: "" }, color: "#6a3327", accent: "#e6cb8a" },
  { id: "visual-3", title: "Modern Literature", author: "BookSwap Edition", description: "", price: 0, category: "Fiction", condition: "Like new", city: "", status: "active", seller: { id: "", name: "" }, color: "#302a41", accent: "#d8c18d" },
  { id: "visual-4", title: "Exam Notes", author: "Student Archive", description: "", price: 0, category: "Notes", condition: "Good", city: "", status: "active", seller: { id: "", name: "" }, color: "#866b28", accent: "#fff0bd" },
  { id: "visual-5", title: "Rare Poems", author: "Old Town Books", description: "", price: 0, category: "Rare Finds", condition: "Good", city: "", status: "active", seller: { id: "", name: "" }, color: "#75392f", accent: "#e6c887" },
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
            <span className="bookmark-badge">BookSwap marketplace</span>
            <h1 className="display mx-auto mt-7 max-w-5xl text-[56px] font-semibold leading-[.94] md:text-[92px]">
              Find your next book.<br /><span className="text-orange">Give yours a second life.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#6c6253]">
              A reader-to-reader marketplace for textbooks, novels, study notes, and hard-to-find editions.
            </p>
          </MotionReveal>

          <MotionReveal delay={0.08} className="mx-auto mt-9 max-w-4xl">
            <form action="/listings" className="catalog-drawer flex flex-col gap-2 rounded-md p-3 sm:flex-row">
              <label className="relative flex-1">
                <Search size={19} className="absolute left-5 top-1/2 -translate-y-1/2 text-orange" />
                <input name="query" className="input !min-h-[58px] !border-0 !bg-transparent !pl-14 !text-sm !shadow-none" placeholder="Search by title, author, subject, or ISBN" aria-label="Search books" />
              </label>
              <button className="btn-primary !min-h-[58px] !px-8">Search books <ArrowRight size={15} /></button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {quickCategories.map(([label, Icon]) => <Link key={label} href={`/listings?category=${encodeURIComponent(label)}`} className="flex items-center gap-2 rounded-full border border-[#cdbd9e] bg-[#fffaf0]/65 px-4 py-2 text-[10px] font-bold transition hover:-translate-y-0.5 hover:border-orange"><Icon size={13} className="text-orange" /> {label}</Link>)}
            </div>
          </MotionReveal>
        </div>

        <div className="desk-surface relative mt-16 min-h-[250px] border-y border-[#261a11]">
          <div className="container-shell relative flex min-h-[250px] items-end justify-center gap-3 overflow-hidden px-5 pt-10">
            {displayBooks.map((book, index) => (
              <MotionReveal key={book.id} delay={index * .06} className={`w-[105px] shrink-0 origin-bottom sm:w-[135px] md:w-[165px] ${index % 2 ? "translate-y-5 rotate-2" : "-rotate-2"}`}>
                <BookCover listing={book} />
              </MotionReveal>
            ))}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-[#89623b] to-[#392518] shadow-[0_-8px_30px_rgba(0,0,0,.25)]" />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-shell">
          <MarketplaceHeading label="Featured shelf" title="Books readers are noticing." link="/listings" />
          {loading ? <SkeletonShelf /> : featured.length ? <div className="shelf-row mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">{featured.map((listing) => <BookCard key={listing.id} listing={listing} />)}</div> : <div className="mt-10"><EmptyState title="The featured shelf is waiting." body={error || "List a book and help start the marketplace."} action="Sell a book" href="/listings/new" /></div>}
        </div>
      </section>

      <section className="border-y border-[#cdbd9e] bg-[#ebe1d0] py-16">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="eyebrow">Browse the book fair</span><h2 className="display mt-3 text-4xl font-semibold md:text-5xl">Start with a shelf.</h2></div><p className="max-w-sm text-[11px] leading-6 text-gray-500">From course essentials to editions that rarely stay listed for long.</p></div>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-5">
            {quickCategories.map(([label, Icon], index) => <Link key={label} href={`/listings?category=${encodeURIComponent(label)}`} className="catalog-drawer group relative min-h-[150px] overflow-hidden rounded-sm p-5 transition hover:-translate-y-1"><span className="absolute right-3 top-3 display text-4xl text-[#d8c6a5]">0{index + 1}</span><Icon size={19} className="text-orange" /><h3 className="display mt-12 text-2xl font-semibold">{label}</h3><span className="mt-2 flex items-center gap-1 text-[9px] font-bold text-gray-500">Open shelf <ArrowRight size={11} /></span></Link>)}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-shell">
          <MarketplaceHeading label="Just listed" title="Fresh arrivals from nearby readers." link="/listings" />
          {loading ? <SkeletonShelf /> : recent.length ? <div className="shelf-row mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">{recent.map((listing) => <BookCard key={listing.id} listing={listing} />)}</div> : data.length ? <div className="shelf-row mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">{featured.map((listing) => <BookCard key={listing.id} listing={listing} />)}</div> : null}
        </div>
      </section>

      <section className="container-shell pb-24">
        <div className="desk-surface relative overflow-hidden rounded-md border border-[#24170f] px-7 py-14 text-[#fff8e9] md:px-14">
          <div className="absolute bottom-0 right-[8%] hidden md:block"><div className="spine-stack">{displayBooks.map((book, index) => <span key={book.id} className="spine" style={{ "--spine-color": book.color, height: `${135 + index * 9}px` } as React.CSSProperties}>{book.title}</span>)}</div></div>
          <div className="relative max-w-xl"><span className="bookmark-badge">Your shelf can earn</span><h2 className="display mt-5 text-5xl font-semibold leading-none">Finished reading?<br />Pass it forward.</h2><p className="mt-5 text-xs leading-7 text-[#d7c5aa]">Photograph the real copy, set a fair price, and meet its next reader.</p><Link href="/listings/new" className="btn-primary mt-7">Sell your book <ArrowRight size={15} /></Link></div>
        </div>
      </section>
    </>
  );
}

function MarketplaceHeading({ label, title, link }: { label: string; title: string; link: string }) {
  return <div className="flex items-end justify-between gap-5 border-b border-[#cdbd9e] pb-5"><div><span className="eyebrow">{label}</span><h2 className="display mt-3 text-4xl font-semibold md:text-5xl">{title}</h2></div><Link href={link} className="hide-mobile flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-orange">View all <ArrowRight size={13} /></Link></div>;
}

function SkeletonShelf() {
  return <div className="shelf-row mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">{[0,1,2,3].map((item) => <BookSkeleton key={item} />)}</div>;
}
