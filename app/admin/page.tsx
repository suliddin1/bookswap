import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { AZ_COPY } from "@/lib/i18n";

export const metadata: Metadata = {
  title: AZ_COPY.admin.metadataTitle,
  description: AZ_COPY.admin.metadataDescription,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
