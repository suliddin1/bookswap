import type { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.profile.metadataTitle,
  description: AZ_COPY.profile.metadataDescription,
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
