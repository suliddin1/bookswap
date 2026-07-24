import Image from "next/image";
import { AZ_COPY } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

export function BookCover({
  listing,
  className = "",
  sizes = "(max-width: 640px) 42vw, (max-width: 1280px) 25vw, 240px",
  priority = false,
}: {
  listing: Pick<Listing, "title" | "author" | "color" | "accent" | "images">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const image = listing.images?.[0];
  const isLocalPreview =
    image?.startsWith("blob:") || image?.startsWith("data:");

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
      {image ? (
        isLocalPreview ? (
          // Local authoring previews never leave the browser and cannot use the optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${listing.title} ${AZ_COPY.listingCard.cover}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={image}
            alt={`${listing.title} ${AZ_COPY.listingCard.cover}`}
            fill
            sizes={sizes}
            quality={72}
            priority={priority}
            className="object-cover"
          />
        )
      ) : (
        <>
          <span className="book-cover-title">{listing.title}</span>
          <span className="book-cover-author">{listing.author}</span>
        </>
      )}
    </div>
  );
}
