"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { parseFavoriteListingsResponse } from "@/lib/account-responses";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

export function FavoritesPage() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [error, setError] = useState<"" | "auth" | "load">("");
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems(null);
      setError("auth");
      return;
    }
    let active = true;
    setError("");
    authFetch("/api/favorites")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error();
        const parsedItems = parseFavoriteListingsResponse(body);
        if (!parsedItems) throw new Error();
        if (active) setItems(parsedItems);
      })
      .catch(() => {
        if (active) setError("load");
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (error === "auth")
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.favorites.authTitle}
          body={AZ_COPY.favorites.authBody}
          action={AZ_COPY.favorites.signIn}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );
  if (error === "load")
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.favorites.unavailableTitle}
          body={AZ_COPY.favorites.unavailableBody}
          action={AZ_COPY.favorites.browseBooks}
          href="/listings"
          headingLevel="h1"
        />
      </div>
    );
  if (authLoading || !items)
    return (
      <div className="container-shell min-h-[600px] animate-pulse py-16">
        <div className="h-28 rounded bg-[#e5dece]" />
      </div>
    );
  return (
    <div className="container-shell py-10 md:py-14">
      <div className="border-b-2 border-[#5b3c25] pb-6">
        <span className="bookmark-badge">{AZ_COPY.favorites.badge}</span>
        <h1 className="display mt-4 text-5xl font-semibold">
          {AZ_COPY.favorites.title}
        </h1>
        <p className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
          <Heart size={12} className="text-orange" /> {AZ_COPY.favorites.intro}
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
            title={AZ_COPY.favorites.emptyTitle}
            body={AZ_COPY.favorites.emptyBody}
            action={AZ_COPY.favorites.browseBooks}
            href="/listings"
          />
        </div>
      )}
    </div>
  );
}
