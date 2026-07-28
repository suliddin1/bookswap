import { BookSkeleton } from "@/components/book-skeleton";
import { AZ_COPY } from "@/lib/i18n";

export function CatalogFallback() {
  return (
    <div className="container-shell min-h-[1100px] py-10 md:py-14">
      <div className="flex min-w-0 flex-col justify-between gap-6 border-b-2 border-[#5b3c25] pb-7 md:flex-row md:items-end">
        <div className="min-w-0">
          <span className="bookmark-badge">{AZ_COPY.catalog.badge}</span>
          <h1 className="display mt-5 break-words text-5xl font-semibold md:text-7xl">
            {AZ_COPY.catalog.title}
          </h1>
        </div>
        <p className="max-w-sm text-xs leading-7 text-muted">
          {AZ_COPY.catalog.intro}
        </p>
      </div>
      <div className="catalog-drawer mt-7 h-[360px] animate-pulse rounded-sm bg-[#e5dece] md:h-[150px]" />
      <div className="mt-9 grid min-w-0 gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="hidden h-[520px] animate-pulse rounded-sm bg-[#e5dece] lg:block" />
        <div className="shelf-row grid min-w-0 grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <BookSkeleton key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
