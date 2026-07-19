import { createHash } from "node:crypto";
import { ApiError } from "./api";

export const LISTING_SORTS = ["newest", "price-low", "price-high"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

type CursorRow = { id: string; created_at: string; price: number };
export type ListingCursor = {
  id: string;
  sort: ListingSort;
  scope: string;
  createdAt?: string;
  price?: number;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parsePublicUuid(value: string) {
  if (!UUID.test(value))
    throw new ApiError("İdentifikator etibarlı deyil.", 400, "INVALID_ID");
  return value;
}

export function parseListingSort(value: string | null): ListingSort {
  const sort = value ?? "newest";
  if (!LISTING_SORTS.includes(sort as ListingSort))
    throw new ApiError("Sıralama seçimi etibarlı deyil.", 400, "INVALID_SORT");
  return sort as ListingSort;
}

export function parseListingLimit(value: string | null, fallback = 24) {
  if (value === null) return fallback;
  if (!/^\d{1,2}$/.test(value))
    throw new ApiError("Səhifə ölçüsü etibarlı deyil.", 400, "INVALID_LIMIT");
  return Math.max(1, Math.min(Number(value), 50));
}

export function createListingCursorScope(parts: Record<string, unknown>) {
  const normalized = Object.keys(parts)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = parts[key] ?? null;
      return result;
    }, {});
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function encodeListingCursor(
  row: CursorRow,
  sort: ListingSort,
  scope: string,
) {
  const cursor: ListingCursor & { v: 1 } = {
    v: 1,
    id: row.id,
    sort,
    scope,
  };
  if (sort === "newest")
    cursor.createdAt = new Date(row.created_at).toISOString();
  else cursor.price = Number(row.price);
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeListingCursor(
  value: string | null,
  expectedSort: ListingSort,
  expectedScope: string,
): ListingCursor | null {
  if (!value) return null;
  try {
    if (value.length > 700 || !/^[A-Za-z0-9_-]+$/.test(value))
      throw new Error("Malformed cursor");
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (Buffer.from(decoded, "utf8").toString("base64url") !== value)
      throw new Error("Non-canonical cursor");
    const cursor = JSON.parse(decoded) as Record<string, unknown>;
    if (
      cursor.v !== 1 ||
      cursor.sort !== expectedSort ||
      cursor.scope !== expectedScope ||
      typeof cursor.id !== "string" ||
      !UUID.test(cursor.id)
    )
      throw new Error("Cursor scope mismatch");

    if (expectedSort === "newest") {
      if (typeof cursor.createdAt !== "string")
        throw new Error("Missing timestamp");
      const canonical = new Date(cursor.createdAt).toISOString();
      if (canonical !== cursor.createdAt) throw new Error("Invalid timestamp");
      return {
        id: cursor.id,
        sort: expectedSort,
        scope: expectedScope,
        createdAt: canonical,
      };
    }

    if (
      typeof cursor.price !== "number" ||
      !Number.isFinite(cursor.price) ||
      cursor.price <= 0 ||
      cursor.price > 10_000
    )
      throw new Error("Invalid price");
    return {
      id: cursor.id,
      sort: expectedSort,
      scope: expectedScope,
      price: cursor.price,
    };
  } catch {
    throw new ApiError(
      "Davam göstəricisi etibarsızdır və ya vaxtı keçib.",
      400,
      "INVALID_CURSOR",
    );
  }
}

export function getListingCursorFilter(cursor: ListingCursor) {
  if (cursor.sort === "newest")
    return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
  if (cursor.sort === "price-low")
    return `price.gt.${cursor.price},and(price.eq.${cursor.price},id.gt.${cursor.id})`;
  return `price.lt.${cursor.price},and(price.eq.${cursor.price},id.lt.${cursor.id})`;
}
