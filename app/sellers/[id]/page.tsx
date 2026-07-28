import type { Metadata } from "next";
import { SellerProfile } from "@/components/seller-profile";
import { AZ_COPY } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: AZ_COPY.seller.metadataTitle,
    description: AZ_COPY.seller.metadataDescription,
    alternates: { canonical: `/sellers/${encodeURIComponent(id)}` },
    openGraph: {
      title: AZ_COPY.seller.metadataTitle,
      description: AZ_COPY.seller.metadataDescription,
      type: "profile",
      locale: "az_AZ",
    },
  };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerProfile id={id} />;
}
