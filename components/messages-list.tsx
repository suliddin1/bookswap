"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { parseChatRoomSummaries } from "@/lib/chat-client";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY, formatAzDateTime } from "@/lib/i18n";
import type { ChatRoomSummary } from "@/lib/chat-client";

export function MessagesList() {
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRooms(null);
      setLoadFailed(false);
      return;
    }

    const controller = new AbortController();
    setLoadFailed(false);
    authFetch("/api/chat/rooms", { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !body || typeof body !== "object")
          throw new Error();
        const rooms = parseChatRoomSummaries(
          "data" in body ? body.data : undefined,
        );
        if (!rooms) throw new Error();
        setRooms(rooms);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setLoadFailed(true);
      });
    return () => controller.abort();
  }, [authLoading, user]);

  if (!authLoading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.messages.authTitle}
          body={AZ_COPY.messages.authBody}
          action={AZ_COPY.messages.signIn}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );

  if (loadFailed)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.messages.unavailableTitle}
          body={AZ_COPY.messages.unavailableBody}
          action={AZ_COPY.messages.browseBooks}
          href="/listings"
          headingLevel="h1"
        />
      </div>
    );

  if (authLoading || !rooms)
    return (
      <div
        className="container-shell min-h-[600px] animate-pulse py-16"
        role="status"
        aria-busy="true"
      >
        <h1 className="sr-only">{AZ_COPY.messages.title}</h1>
        <span className="sr-only">{AZ_COPY.messages.loading}</span>
        <div className="h-24 rounded-xl bg-[#e5dece]" />
      </div>
    );

  const unreadCount = rooms.reduce(
    (total, room) => total + Math.max(0, room.unreadCount),
    0,
  );

  return (
    <div className="container-shell py-12 md:py-16">
      <span className="eyebrow">{AZ_COPY.messages.eyebrow}</span>
      <h1 className="display mt-4 text-5xl font-semibold">
        {AZ_COPY.messages.title}
      </h1>
      <p role="status" className="mt-3 text-xs font-bold text-gray-600">
        {AZ_COPY.messages.unread(unreadCount)}
      </p>
      {rooms.length ? (
        <ul className="card mt-9 divide-y divide-[#e8dfcf] overflow-hidden">
          {rooms.map((room) => {
            const person =
              room.currentUserId === room.seller.id ? room.buyer : room.seller;
            return (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex min-h-16 items-center gap-4 p-5 transition hover:bg-[#f2eadb]"
                >
                  <BookCover
                    listing={room.listing}
                    className="w-12 shrink-0 !p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{person.name}</b>
                    <span className="mt-1 block truncate text-[11px] text-gray-600">
                      {room.listing.title}
                    </span>
                    <time
                      dateTime={room.last_message_at}
                      className="mt-1 block text-[10px] text-gray-500"
                    >
                      {formatAzDateTime(room.last_message_at)}
                    </time>
                  </div>
                  {room.unreadCount > 0 ? (
                    <span
                      aria-label={AZ_COPY.messages.unread(room.unreadCount)}
                      className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-orange px-2 text-[10px] font-bold text-white"
                    >
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  ) : (
                    <MessageCircle
                      aria-hidden="true"
                      size={17}
                      className="shrink-0 text-orange"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-9">
          <EmptyState
            title={AZ_COPY.messages.emptyTitle}
            body={AZ_COPY.messages.emptyBody}
            action={AZ_COPY.messages.browseBooks}
            href="/listings"
          />
        </div>
      )}
    </div>
  );
}
