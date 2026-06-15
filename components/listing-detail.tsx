"use client";

import Link from "next/link";
import { ArrowLeft, Heart, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard } from "@/components/book-card";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";
import { Listing } from "@/lib/types";
import { useListings } from "@/hooks/use-listings";

export function ListingDetail({ id }: { id: string }) {
  const [listing, setListing] = useState<(Listing & { reviews?: any[] }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useListings();

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setListing(body.data);
    }).catch((reason) => setError(reason.message));
  }, [id]);

  async function messageSeller() {
    if (!listing?.sellerId) return;
    setBusy(true);
    try {
      const response = await authFetch("/api/chat/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: listing.id, sellerId: listing.sellerId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.href = `/chat/${body.data.id}`;
    } catch {
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="container-shell py-16"><EmptyState title="This book is unavailable." body={error} action="Browse books" href="/listings" /></div>;
  if (!listing) return <div className="container-shell min-h-[650px] animate-pulse py-16"><div className="grid gap-12 lg:grid-cols-2"><div className="min-h-[520px] rounded-2xl bg-[#e5dece]" /><div className="space-y-5">{[1,2,3,4].map((item) => <div key={item} className="h-10 rounded bg-[#e5dece]" />)}</div></div></div>;

  return (
    <div className="container-shell py-10 md:py-14">
      <Link href="/listings" className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-orange"><ArrowLeft size={14} /> Back to the shelves</Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.02fr]">
        <section className="relative grid min-h-[560px] place-items-center rounded-[22px] border border-[#d8cbb5] bg-[#e8dfcf] p-14 shadow-[inset_0_0_70px_rgba(80,56,25,.08)]">
          <BookCover listing={listing} className="w-full max-w-[310px]" />
          <span className="absolute bottom-5 left-5 pill"><ShieldCheck size={12} className="text-orange" /> Community listing</span>
        </section>
        <section>
          <span className="eyebrow">Available from a reader</span>
          <div className="mt-5 flex justify-between gap-5"><div><h1 className="display text-5xl font-semibold leading-none md:text-7xl">{listing.title}</h1><p className="mt-3 text-sm text-gray-500">by {listing.author}</p></div><button aria-label="Save book" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d8cbb5] bg-[#fffaf0] text-orange"><Heart size={17} /></button></div>
          <div className="mt-8 flex items-end gap-3 border-b border-[#d8cbb5] pb-8"><strong className="display text-5xl text-orange">₼{listing.price}</strong>{listing.originalPrice && <span className="mb-1 text-sm text-gray-400 line-through">₼{listing.originalPrice}</span>}</div>
          <div className="grid grid-cols-3 gap-3 border-b border-[#d8cbb5] py-7">{[["Condition",listing.condition],["Category",listing.category],["Location",listing.city]].map(([label,value]) => <div key={label}><span className="text-[8px] font-bold uppercase tracking-[.13em] text-gray-400">{label}</span><b className="mt-2 block text-xs">{value}</b></div>)}</div>
          <div className="py-7"><h2 className="display text-2xl font-semibold">About this copy</h2><p className="mt-3 text-sm leading-7 text-gray-600">{listing.description}</p>{listing.isbn && <p className="mt-3 text-[9px] text-gray-400">ISBN {listing.isbn}</p>}</div>
          <div className="card flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-bold text-orange">{listing.seller.initials}</span><div><b className="block text-xs">{listing.seller.name}</b><span className="mt-1 block text-[9px] text-gray-500">BookSwap reader</span></div></div><span className="flex items-center gap-1 text-[9px] text-gray-500"><MapPin size={11} /> {listing.seller.city ?? listing.city}</span></div>
          <button disabled={busy} onClick={messageSeller} className="btn-primary mt-5 w-full"><MessageCircle size={15} /> {busy ? "Opening conversation..." : "Message seller"}</button>
        </section>
      </div>
      <section className="mt-24 border-t border-[#d8cbb5] pt-14"><h2 className="display text-4xl font-semibold">Similar books.</h2><div className="mt-9 grid grid-cols-2 gap-5 md:grid-cols-4">{data.filter((item) => item.id !== listing.id).slice(0,4).map((item) => <BookCard key={item.id} listing={item} />)}</div></section>
    </div>
  );
}
