import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookSkeleton } from "@/components/book-skeleton";
import { AZ_COPY } from "@/lib/i18n";

export function HomeListingSectionFallback({
  kind,
}: {
  kind: "featured" | "recent";
}) {
  const label =
    kind === "featured" ? AZ_COPY.home.featuredLabel : AZ_COPY.home.recentLabel;
  const title =
    kind === "featured" ? AZ_COPY.home.featuredTitle : AZ_COPY.home.recentTitle;
  return (
    <section className="py-20">
      <div className="container-shell">
        <MarketplaceHeading label={label} title={title} link="/listings" />
        <SkeletonShelf />
      </div>
    </section>
  );
}

export function MarketplaceHeading({
  label,
  title,
  link,
}: {
  label: string;
  title: string;
  link: string;
}) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-5 border-b border-[#cdbd9e] pb-5">
      <div className="min-w-0">
        <span className="eyebrow">{label}</span>
        <h2 className="display mt-3 break-words text-4xl font-semibold [overflow-wrap:anywhere] md:text-5xl">
          {title}
        </h2>
      </div>
      <Link
        href={link}
        className="hide-mobile flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-orange"
      >
        {AZ_COPY.home.viewAll} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export function SkeletonShelf() {
  return (
    <div className="shelf-row mt-10 grid min-w-0 grid-cols-2 gap-5 md:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <BookSkeleton key={item} />
      ))}
    </div>
  );
}
