"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";
import type { Listing } from "@/lib/types";

export function FavoritesPage() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    authFetch("/api/favorites")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setItems(body.data);
      })
      .catch((reason) => setError(reason.message));
  }, []);
  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Sign in to see favorites."
          body={error}
          action="Sign in"
          href="/login"
        />
      </div>
    );
  if (!items)
    return (
      <div className="container-shell min-h-[600px] animate-pulse py-16">
        <div className="h-28 rounded bg-[#e5dece]" />
      </div>
    );
  return (
    <div className="container-shell py-10 md:py-14">
      <div className="border-b-2 border-[#5b3c25] pb-6">
        <span className="bookmark-badge">Saved catalog</span>
        <h1 className="display mt-4 text-5xl font-semibold">Favorites.</h1>
        <p className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
          <Heart size={12} className="text-orange" /> Books you want to return
          to.
        </p>
      </div>
      {items.length ? (
        <div className="shelf-row mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map((listing) => (
            <BookCard key={listing.id} listing={listing} saved />
          ))}
        </div>
      ) : (
        <div className="mt-9">
          <EmptyState
            title="No favorites yet."
            body="Save books from the marketplace and they will appear here."
            action="Browse books"
            href="/listings"
          />
        </div>
      )}
    </div>
  );
}
