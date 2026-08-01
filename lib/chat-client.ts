import type { Listing, ListingStatus } from "@/lib/types";

type ReaderSummary = {
  id: string;
  name: string;
  city?: string | null;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export type ChatRoomSummary = {
  id: string;
  currentUserId: string;
  buyer: ReaderSummary;
  seller: ReaderSummary;
  listing: Listing;
  unreadCount: number;
  last_message_at: string;
};

export type ChatRoomDetail = ChatRoomSummary & {
  messages: ChatMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isReaderSummary(value: unknown): value is ReaderSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.city === undefined ||
      value.city === null ||
      typeof value.city === "string") &&
    (value.created_at === undefined || isTimestamp(value.created_at))
  );
}

function isListingStatus(value: unknown): value is ListingStatus {
  return ["draft", "active", "sold", "locked"].includes(String(value));
}

function isListing(value: unknown): value is Listing {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.author === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.category === "string" &&
    typeof value.condition === "string" &&
    typeof value.city === "string" &&
    isListingStatus(value.status) &&
    isReaderSummary(value.seller) &&
    (value.images === undefined ||
      (Array.isArray(value.images) &&
        value.images.every((image) => typeof image === "string")))
  );
}

export function parseChatMessage(value: unknown): ChatMessage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.sender_id !== "string" ||
    typeof value.text !== "string" ||
    !isTimestamp(value.created_at)
  )
    return null;
  return {
    id: value.id,
    sender_id: value.sender_id,
    text: value.text,
    created_at: value.created_at,
  };
}

function parseChatRoomSummary(value: unknown): ChatRoomSummary | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.currentUserId !== "string" ||
    !isReaderSummary(value.buyer) ||
    !isReaderSummary(value.seller) ||
    !isListing(value.listing) ||
    typeof value.unreadCount !== "number" ||
    !Number.isFinite(value.unreadCount) ||
    !isTimestamp(value.last_message_at)
  )
    return null;
  return {
    id: value.id,
    currentUserId: value.currentUserId,
    buyer: value.buyer,
    seller: value.seller,
    listing: value.listing,
    unreadCount: value.unreadCount,
    last_message_at: value.last_message_at,
  };
}

export function parseChatRoomSummaries(
  value: unknown,
): ChatRoomSummary[] | null {
  if (!Array.isArray(value)) return null;
  const rooms = value.map(parseChatRoomSummary);
  return rooms.every((room): room is ChatRoomSummary => room !== null)
    ? rooms
    : null;
}

export function parseChatRoomDetail(value: unknown): ChatRoomDetail | null {
  const room = parseChatRoomSummary(value);
  if (!room || !isRecord(value) || !Array.isArray(value.messages)) return null;
  const messages = value.messages.map(parseChatMessage);
  if (!messages.every((message): message is ChatMessage => message !== null))
    return null;
  return { ...room, messages };
}
