import { Catalog } from "@/components/catalog";
import { LISTING_SORTS } from "@/lib/listing-pagination";
import {
  AZERBAIJAN_CITIES,
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
} from "@/lib/marketplace";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    query?: string;
    city?: string;
    condition?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const parsedMaxPrice = Number(params.maxPrice);
  const maxPrice =
    Number.isInteger(parsedMaxPrice) &&
    parsedMaxPrice >= 5 &&
    parsedMaxPrice <= 200
      ? parsedMaxPrice
      : 200;
  const category = BOOK_CATEGORIES.includes(params.category as never)
    ? params.category
    : "All books";
  const city = AZERBAIJAN_CITIES.includes(params.city as never)
    ? params.city
    : "";
  const condition = BOOK_CONDITIONS.includes(params.condition as never)
    ? params.condition
    : "";
  const sort = LISTING_SORTS.includes(params.sort as never)
    ? params.sort
    : "newest";

  return (
    <Catalog
      initialCategory={category}
      initialQuery={params.query?.slice(0, 200)}
      initialCity={city}
      initialCondition={condition}
      initialMaxPrice={maxPrice}
      initialSort={sort}
    />
  );
}
