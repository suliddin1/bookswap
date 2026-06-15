import { Listing } from "@/lib/types";

const covers = [
  ["#213a32", "#d9b65d"],
  ["#512b26", "#e2c785"],
  ["#243447", "#d9c49a"],
  ["#6a5834", "#f2dfad"],
] as const;

export function normalizeListing(row: Record<string, any>): Listing {
  const palette = covers[Math.abs(String(row.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % covers.length];
  const seller = row.seller ?? {};
  const name = seller.name ?? "BookSwap reader";
  return {
    id: String(row.id),
    title: row.title,
    author: row.author ?? "",
    description: row.description ?? "",
    isbn: row.isbn ?? undefined,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    images: row.images ?? [],
    category: row.category ?? "Books",
    condition: row.condition ?? "Good",
    city: row.city ?? seller.city ?? "Azerbaijan",
    color: palette[0],
    accent: palette[1],
    status: row.status ?? "active",
    sellerId: row.seller_id,
    seller: {
      id: seller.id ?? row.seller_id ?? "",
      name,
      initials: name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
      city: seller.city ?? row.city,
    },
    createdAt: row.created_at,
    posted: row.created_at ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(row.created_at)) : undefined,
    saves: row.favorites?.[0]?.count ?? 0,
  };
}
