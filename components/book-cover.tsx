import { Listing } from "@/lib/types";

export function BookCover({
  listing,
  className = "",
}: {
  listing: Pick<Listing, "title" | "author" | "color" | "accent" | "images">;
  className?: string;
}) {
  return (
    <div
      className={`book-cover ${className}`}
      style={
        {
          "--cover-color": listing.color,
          "--cover-accent": listing.accent,
        } as React.CSSProperties
      }
    >
      {listing.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.images[0]} alt={`${listing.title} cover`} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <span className="book-cover-title">{listing.title}</span>
          <span className="book-cover-author">{listing.author}</span>
        </>
      )}
    </div>
  );
}
