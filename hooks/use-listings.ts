"use client";

import { useEffect, useState } from "react";
import { Listing } from "@/lib/types";

export function useListings(filters: { query?: string; city?: string; category?: string } = {}) {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    fetch(`/api/listings?${params}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load listings");
        setData(body.data ?? []);
        setError("");
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [filters.query, filters.city, filters.category]);

  return { data, loading, error };
}
