import { ChatPanel } from "@/components/chat-panel";

export default async function ChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <ChatPanel roomId={roomId} />;
}
