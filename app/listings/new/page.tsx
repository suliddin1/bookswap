import type { Metadata } from "next";
import { ListingWizard } from "@/components/listing-wizard";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.listingForm.newMetadataTitle,
  description: AZ_COPY.listingForm.newMetadataDescription,
  robots: { index: false, follow: false },
};

export default function NewListingPage() {
  return <ListingWizard />;
}
