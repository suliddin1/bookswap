import type { Metadata } from "next";
import { ListingDetail } from "@/components/listing-detail";
import { AZ_COPY } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: AZ_COPY.listingDetail.metadataTitle,
    description: AZ_COPY.listingDetail.metadataDescription,
    alternates: { canonical: `/listings/${encodeURIComponent(id)}` },
    openGraph: {
      title: AZ_COPY.listingDetail.metadataTitle,
      description: AZ_COPY.listingDetail.metadataDescription,
      type: "website",
      locale: "az_AZ",
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}
