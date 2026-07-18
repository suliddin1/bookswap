import { MessagesList } from "@/components/messages-list";
import { AZ_COPY } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: AZ_COPY.messages.metadataTitle,
  description: AZ_COPY.messages.metadataDescription,
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return <MessagesList />;
}
