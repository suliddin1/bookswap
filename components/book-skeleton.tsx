export function BookSkeleton() {
  return (
    <article aria-hidden="true" className="market-book-card animate-pulse">
      <div className="aspect-[.72] rounded-[5px_14px_14px_5px] bg-[#e5dece]" />
      <div className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-3/4 rounded-full bg-[#e5dece]" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-[#eee8dc]" />
          </div>
          <div className="h-6 w-12 rounded-full bg-[#e5dece]" />
        </div>
        <div className="mt-4 flex justify-between gap-2 border-t border-[#95866f] pt-3">
          <div className="h-3 w-14 rounded-full bg-[#eee8dc]" />
          <div className="h-3 w-16 rounded-full bg-[#eee8dc]" />
        </div>
      </div>
    </article>
  );
}
