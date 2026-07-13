"use client";

import { useEffect, useState } from "react";
import { Listing } from "@/lib/types";

export function useListings(
  filters: {
    query?: string;
    city?: string;
    category?: string;
    sort?: string;
  } = {},
) {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { query, city, category, sort } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries({ query, city, category, sort }).forEach(
      ([key, value]) => value && params.set(key, value),
    );
    fetch(`/api/listings?${params}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Could not load listings");
        setData(body.data ?? []);
        setError("");
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [query, city, category, sort]);

  return { data, loading, error };
}
