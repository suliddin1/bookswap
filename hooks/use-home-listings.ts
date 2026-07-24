"use client";

import { useEffect, useState } from "react";
import { AZ_COPY } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

const cacheLifetimeMs = 30_000;
let cache: { items: Listing[]; storedAt: number } | null = null;
let pending: Promise<Listing[]> | null = null;

function freshItems() {
  return cache && Date.now() - cache.storedAt < cacheLifetimeMs
    ? cache.items
    : null;
}

function loadHomeListings() {
  const fresh = freshItems();
  if (fresh) return Promise.resolve(fresh);
  pending ??= fetch("/api/listings")
    .then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(AZ_COPY.global.listingsUnavailable);
      const items = Array.isArray(body.data?.items) ? body.data.items : [];
      cache = { items, storedAt: Date.now() };
      return items;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function useHomeListings() {
  const initialItems = freshItems();
  const [state, setState] = useState<{
    data: Listing[];
    loading: boolean;
    error: string;
  }>(() => ({
    data: initialItems ?? [],
    loading: !initialItems,
    error: "",
  }));

  useEffect(() => {
    let active = true;
    const fresh = freshItems();
    if (fresh) {
      setState({ data: fresh, loading: false, error: "" });
      return () => {
        active = false;
      };
    }
    void loadHomeListings()
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch(() => {
        if (active)
          setState({
            data: [],
            loading: false,
            error: AZ_COPY.global.listingsUnavailable,
          });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
