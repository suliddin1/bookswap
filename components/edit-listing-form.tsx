"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { authFetch } from "@/lib/client-api";
import type { Listing } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

export function EditListingForm({ id }: { id: string }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((response) => response.json())
      .then((body) => setListing(body.data))
      .catch(() => setError("Could not load listing."));
  }, [id]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
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
      }),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error);
    else {
      setListing(body.data);
      setSaved(true);
    }
  }
  if (error && !listing)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Could not edit this listing."
          body={error}
          action="My shelf"
          href="/profile"
        />
      </div>
    );
  if (!listing)
    return (
      <div className="container-shell min-h-[600px] animate-pulse py-16">
        <div className="mx-auto h-[500px] max-w-2xl rounded-2xl bg-[#e5dece]" />
      </div>
    );
  const field = (key: keyof Listing, label: string, type = "text") => (
    <label>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
        {label}
      </span>
      <input
        className="input"
        type={type}
        value={String(listing[key] ?? "")}
        onChange={(event) =>
          setListing({
            ...listing,
            [key]:
              type === "number"
                ? Number(event.target.value)
                : event.target.value,
          })
        }
      />
    </label>
  );
  return (
    <div className="container-shell py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500"
        >
          <ArrowLeft size={13} /> My shelf
        </Link>
        <span className="eyebrow mt-8">Manage listing</span>
        <h1 className="display mt-4 text-5xl font-semibold">
          Edit book details.
        </h1>
        <form onSubmit={submit} className="card mt-8 grid gap-5 p-6 md:p-8">
          {field("title", "Title")}
          {field("author", "Author / subject")}
          <label>
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
              Description
            </span>
            <textarea
              className="input min-h-[130px] py-3"
              value={listing.description}
              onChange={(event) =>
                setListing({ ...listing, description: event.target.value })
              }
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("price", "Price (AZN)", "number")}
            {field("city", "Location")}
          </div>
          {error && <p className="text-[10px] text-red-700">{error}</p>}
          {saved && (
            <p className="flex items-center gap-2 text-[10px] text-emerald-700">
              <Check size={12} /> Changes saved
            </p>
          )}
          <button className="btn-primary">Save changes</button>
        </form>
      </div>
    </div>
  );
}
