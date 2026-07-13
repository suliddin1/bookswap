import { Catalog } from "@/components/catalog";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; query?: string }>;
}) {
  const params = await searchParams;
  return (
    <Catalog initialCategory={params.category} initialQuery={params.query} />
  );
}
