import type { Metadata } from "next";
import { EditListingForm } from "@/components/edit-listing-form";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.listingForm.editMetadataTitle,
  description: AZ_COPY.listingForm.editMetadataDescription,
  robots: { index: false, follow: false },
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditListingForm id={id} />;
}
