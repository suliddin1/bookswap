"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Listing } from "@/lib/types";

export function useListings(
  filters: {
    query?: string;
    city?: string;
    category?: string;
    condition?: string;
    maxPrice?: number;
    sort?: string;
  } = {},
) {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const { query, city, category, condition, maxPrice, sort } = filters;

  const buildParams = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      Object.entries({
        query,
        city,
        category,
        condition,
        maxPrice,
        sort,
      }).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null)
          params.set(key, String(value));
      });
      if (cursor) params.set("cursor", cursor);
      return params;
    },
    [query, city, category, condition, maxPrice, sort],
  );

  useEffect(() => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    const controller = new AbortController();
    setLoading(true);
    setLoadingMore(false);
    setData([]);
    setNextCursor(null);
    fetch(`/api/listings?${buildParams()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Could not load listings");
        if (version !== requestVersion.current) return;
        setData(body.data?.items ?? []);
        setNextCursor(body.data?.nextCursor ?? null);
        setError("");
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        if (version === requestVersion.current) setError(reason.message);
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => controller.abort();
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/listings?${buildParams(nextCursor)}`);
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Could not load more listings");
      if (version !== requestVersion.current) return;
      setData((current) => {
        const known = new Set(current.map((listing) => listing.id));
        return [
          ...current,
          ...(body.data?.items ?? []).filter(
            (listing: Listing) => !known.has(listing.id),
          ),
        ];
      });
      setNextCursor(body.data?.nextCursor ?? null);
      setError("");
    } catch (reason) {
      if (version === requestVersion.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load more listings",
        );
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [buildParams, loadingMore, nextCursor]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    loadMore,
  };
}
