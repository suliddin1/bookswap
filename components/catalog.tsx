"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, MapPin, Search, Tag, X } from "lucide-react";
import { BookCard } from "@/components/book-card";
import { BookSkeleton } from "@/components/book-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useListings } from "@/hooks/use-listings";

const categories = ["All books", "Textbooks", "Fiction", "Exam Prep", "Notes", "Rare Finds", "Business", "Science"];

export function Catalog({ initialCategory = "All books", initialQuery = "" }: { initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState(200);
  const { data, loading, error } = useListings({ query, category: category === "All books" ? "" : category, city });
  const filtered = useMemo(() => data.filter((listing) => listing.price <= maxPrice && (!condition || listing.condition === condition)), [data, maxPrice, condition]);

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="flex flex-col justify-between gap-6 border-b-2 border-[#5b3c25] pb-7 md:flex-row md:items-end">
        <div><span className="bookmark-badge">Library catalog</span><h1 className="display mt-5 text-5xl font-semibold md:text-7xl">Books for sale.</h1></div>
        <p className="max-w-sm text-xs leading-7 text-gray-500">Every result is a real copy listed by a reader. Search the catalog, then message the seller directly.</p>
      </div>

      <section className="catalog-drawer mt-7 rounded-sm p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#cfbea0] pb-3"><span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.16em]"><BookOpen size={13} className="text-orange" /> Catalog search card</span><span className="text-[9px] text-gray-400">BookSwap / Available copies</span></div>
        <div className="grid gap-4 md:grid-cols-[1.4fr_.7fr_.7fr_.6fr]">
          <CatalogField label="Title / author / ISBN"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange" size={14} /><input className="input !min-h-[42px] !pl-9" placeholder="Search catalog..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} /></button>}</label></CatalogField>
          <CatalogField label="Location"><Select value={city} onChange={setCity} options={[["","Anywhere"],["Baku","Baku"],["Ganja","Ganja"],["Sumqayit","Sumqayit"],["Shaki","Shaki"]]} icon={MapPin} /></CatalogField>
          <CatalogField label="Condition"><Select value={condition} onChange={setCondition} options={[["","Any condition"],["Like new","Like new"],["Very good","Very good"],["Good","Good"],["Well read","Well read"]]} icon={Tag} /></CatalogField>
          <CatalogField label="Maximum price"><div className="pt-1"><input className="w-full accent-orange" type="range" min="5" max="200" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} /><span className="mt-1 block text-center text-[9px] font-bold">Up to ₼{maxPrice}</span></div></CatalogField>
        </div>
      </section>

      <div className="mt-9 grid gap-8 lg:grid-cols-[180px_1fr]">
        <aside>
          <p className="border-b-2 border-[#5b3c25] pb-3 text-[9px] font-extrabold uppercase tracking-[.16em]">Subject index</p>
          <div className="mt-2 divide-y divide-[#d5c5a8] border-b border-[#d5c5a8]">{categories.map((item, index) => <button key={item} onClick={() => setCategory(item)} className={`flex w-full items-center justify-between py-3 text-left text-[10px] font-bold transition ${category === item ? "text-orange" : "text-gray-600 hover:pl-1 hover:text-ink"}`}><span>{item}</span><span className="display text-sm text-[#b8a482]">{String(index + 1).padStart(2,"0")}</span></button>)}</div>
          <div className="mt-7 border-l-2 border-orange pl-4"><b className="display text-xl">Reader listed.</b><p className="mt-2 text-[9px] leading-5 text-gray-500">Prices, condition, and pickup details come directly from the seller.</p></div>
        </aside>

        <section>
          <div className="mb-6 flex items-center justify-between border-b border-[#cdbd9e] pb-3"><p className="text-[9px] font-bold uppercase tracking-[.14em]">{filtered.length} catalog entries</p><button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.1em]">Newest listed <ChevronDown size={12} /></button></div>
          {loading ? <div className="shelf-row grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">{[0,1,2,3,4,5,6,7].map((item) => <BookSkeleton key={item} />)}</div>
            : filtered.length ? <div className="shelf-row grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 xl:grid-cols-4">{filtered.map((listing) => <BookCard key={listing.id} listing={listing} />)}</div>
            : <EmptyState title="No matching catalog entries." body={error || "Try a broader search or list the book readers are missing."} action="Sell a book" href="/listings/new" />}
        </section>
      </div>
    </div>
  );
}

function CatalogField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="mb-2 block text-[8px] font-extrabold uppercase tracking-[.13em] text-gray-500">{label}</span>{children}</div>;
}

function Select({ value, onChange, options, icon: Icon }: { value: string; onChange: (value: string) => void; options: [string,string][]; icon: typeof MapPin }) {
  return <label className="relative block"><Icon size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange" /><select className="input !min-h-[42px] appearance-none !pl-8 !pr-8 text-[10px]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([id,label]) => <option value={id} key={id}>{label}</option>)}</select><ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" /></label>;
}
