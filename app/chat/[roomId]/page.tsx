import { ChatPanel } from "@/components/chat-panel";
import { AZ_COPY } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: AZ_COPY.chat.metadataTitle,
  description: AZ_COPY.chat.metadataDescription,
  robots: { index: false, follow: false },
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ChatPanel roomId={roomId} />;
}
