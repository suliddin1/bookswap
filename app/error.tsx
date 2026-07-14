"use client";

import { useEffect } from "react";
import { AZ_COPY } from "@/lib/i18n";

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
        <span className="bookmark-badge">{AZ_COPY.global.errorBadge}</span>
        <h1 className="display mt-5 text-4xl font-semibold">
          {AZ_COPY.global.errorTitle}
        </h1>
        <p className="mt-3 text-xs leading-6 text-gray-500">
          {AZ_COPY.global.errorBody}
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          {AZ_COPY.global.retry}
        </button>
      </div>
    </div>
  );
}
