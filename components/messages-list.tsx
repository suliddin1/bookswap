"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { parseChatRoomSummaries } from "@/lib/chat-client";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY, formatAzDateTime } from "@/lib/i18n";
import type { ChatRoomSummary } from "@/lib/chat-client";

export function MessagesList() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [roomData, setRoomData] = useState<{
    ownerId: string;
    rooms: ChatRoomSummary[];
  } | null>(null);
  const rooms = roomData && roomData.ownerId === userId ? roomData.rooms : null;
  const [loadFailedForUserId, setLoadFailedForUserId] = useState<string | null>(
    null,
  );
  const loadFailed = Boolean(userId && loadFailedForUserId === userId);
  const loadErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setRoomData(null);
      setLoadFailedForUserId(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setRoomData(null);
    setLoadFailedForUserId(null);
    authFetch("/api/chat/rooms", { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !body || typeof body !== "object")
          throw new Error();
        const rooms = parseChatRoomSummaries(
          "data" in body ? body.data : undefined,
        );
        if (!rooms) throw new Error();
        if (active) setRoomData({ ownerId: userId, rooms });
      })
      .catch((reason: unknown) => {
        if (
          active &&
          !(reason instanceof DOMException && reason.name === "AbortError")
        )
          setLoadFailedForUserId(userId);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, userId]);

  useEffect(() => {
    if (loadFailed) loadErrorRef.current?.focus();
  }, [loadFailed]);

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
      <div
        ref={loadErrorRef}
        className="container-shell py-16"
        role="alert"
        tabIndex={-1}
      >
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
      <h1
        id="messages-title"
        className="display mt-4 break-words text-4xl font-semibold [overflow-wrap:anywhere] sm:text-5xl"
      >
        {AZ_COPY.messages.title}
      </h1>
      <p
        id="messages-unread-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 text-xs font-bold text-[#6b6254]"
      >
        {AZ_COPY.messages.unread(unreadCount)}
      </p>
      {rooms.length ? (
        <ul
          aria-label={AZ_COPY.messages.listLabel}
          aria-describedby="messages-unread-status"
          className="card mt-9 min-w-0 divide-y divide-[#d8cbb5]"
        >
          {rooms.map((room) => {
            const person =
              room.currentUserId === room.seller.id ? room.buyer : room.seller;
            return (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex min-h-16 min-w-0 items-center gap-4 rounded-xl p-5 transition hover:bg-[#f2eadb] max-[430px]:items-start max-[430px]:p-4"
                >
                  <BookCover
                    listing={room.listing}
                    className="w-12 shrink-0 !p-1"
                    sizes="48px"
                  />
                  <div className="min-w-0 flex-1">
                    <b className="block break-words text-sm [overflow-wrap:anywhere]">
                      {person.name}
                    </b>
                    <span className="mt-1 block break-words text-xs text-[#6b6254] [overflow-wrap:anywhere]">
                      {room.listing.title}
                    </span>
                    <time
                      dateTime={room.last_message_at}
                      className="mt-1 block text-xs text-[#6b6254]"
                    >
                      {formatAzDateTime(room.last_message_at)}
                    </time>
                  </div>
                  {room.unreadCount > 0 ? (
                    <span
                      aria-label={AZ_COPY.messages.unread(room.unreadCount)}
                      className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full bg-orange px-2 text-xs font-bold text-white"
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
