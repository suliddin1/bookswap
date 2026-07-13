"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BookSwap page error", error);
  }, [error]);
  return (
    <div className="container-shell grid min-h-[600px] place-items-center py-16">
      <div className="card max-w-lg p-9 text-center">
        <span className="bookmark-badge">Something went wrong</span>
        <h1 className="display mt-5 text-4xl font-semibold">
          This shelf could not load.
        </h1>
        <p className="mt-3 text-xs leading-6 text-gray-500">
          Try again. If the problem continues, no account action or payment has
          been taken by BookSwap.
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
