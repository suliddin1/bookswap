import { NotificationsPage } from "@/components/notifications-page";
import { AZ_COPY } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: AZ_COPY.notifications.metadataTitle,
  description: AZ_COPY.notifications.metadataDescription,
  robots: { index: false, follow: false },
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
