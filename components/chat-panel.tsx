"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Send, ShieldCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  parseChatMessage,
  parseChatRoomDetail,
  type ChatRoomDetail,
} from "@/lib/chat-client";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAzn,
  formatAzTime,
  formatCity,
  localizeApiError,
} from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabase";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function responseCode(value: unknown) {
  return isRecord(value) && typeof value.code === "string"
    ? value.code
    : undefined;
}

function responseData(value: unknown) {
  return isRecord(value) ? value.data : undefined;
}

export function ChatPanel({ roomId }: { roomId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [text, setText] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [sendError, setSendError] = useState("");
  const [readError, setReadError] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(async () => {
    if (!user) return;
    try {
      const response = await authFetch(`/api/chat/rooms/${roomId}`, {
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(responseCode(body), AZ_COPY.chat.readFailed),
        );
      setReadError("");
    } catch {
      setReadError(AZ_COPY.chat.readFailed);
    }
  }, [roomId, user]);

  const loadRoom = useCallback(
    async (signal?: AbortSignal) => {
      const response = await authFetch(`/api/chat/rooms/${roomId}`, { signal });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error();
      const parsed = parseChatRoomDetail(responseData(body));
      if (!parsed) throw new Error();
      setRoom(parsed);
      return parsed;
    },
    [roomId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoom(null);
      setLoadFailed(false);
      return;
    }

    const controller = new AbortController();
    setLoadFailed(false);
    loadRoom(controller.signal)
      .then(() => {
        if (document.visibilityState === "visible" && document.hasFocus())
          void markRead();
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setLoadFailed(true);
      });
    return () => controller.abort();
  }, [authLoading, loadRoom, markRead, user]);

  const roomReady = Boolean(room);
  useEffect(() => {
    if (!user || !roomReady) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let subscribedOnce = false;
    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        ({ new: value }) => {
          const message = parseChatMessage(value);
          if (!message) return;
          setRoom((current) =>
            current && !current.messages.some((item) => item.id === message.id)
              ? { ...current, messages: [...current.messages, message] }
              : current,
          );
          if (document.visibilityState === "visible" && document.hasFocus())
            void markRead();
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (subscribedOnce) {
          void loadRoom()
            .then(() => {
              if (document.visibilityState === "visible" && document.hasFocus())
                void markRead();
            })
            .catch(() => setLoadFailed(true));
        }
        subscribedOnce = true;
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadRoom, markRead, roomId, roomReady, user]);

  useEffect(() => {
    if (!user || !roomReady) return;
    const acknowledgeVisibleRoom = () => {
      if (document.visibilityState === "visible" && document.hasFocus())
        void markRead();
    };
    document.addEventListener("visibilitychange", acknowledgeVisibleRoom);
    window.addEventListener("focus", acknowledgeVisibleRoom);
    return () => {
      document.removeEventListener("visibilitychange", acknowledgeVisibleRoom);
      window.removeEventListener("focus", acknowledgeVisibleRoom);
    };
  }, [markRead, roomReady, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [room?.messages.length]);

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const value = text.trim();
    if (!value || !room || sending) return;

    setSending(true);
    setSendError("");
    try {
      const response = await authFetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, text: value }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setSendError(
          localizeApiError(responseCode(body), AZ_COPY.chat.sendFailed),
        );
        return;
      }
      const message = parseChatMessage(responseData(body));
      if (!message) {
        setSendError(AZ_COPY.chat.sendFailed);
        return;
      }
      setRoom((current) =>
        current && !current.messages.some((item) => item.id === message.id)
          ? { ...current, messages: [...current.messages, message] }
          : current,
      );
      setText("");
    } catch {
      setSendError(AZ_COPY.chat.sendFailed);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!authLoading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.chat.authTitle}
          body={AZ_COPY.chat.authBody}
          action={AZ_COPY.chat.signIn}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );

  if (loadFailed)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.chat.unavailableTitle}
          body={AZ_COPY.chat.unavailableBody}
          action={AZ_COPY.chat.openMessages}
          href="/messages"
          headingLevel="h1"
        />
      </div>
    );

  if (authLoading || !room)
    return (
      <div
        className="container-shell min-h-[680px] animate-pulse py-10"
        role="status"
        aria-busy="true"
      >
        <h1 className="sr-only">{AZ_COPY.chat.metadataTitle}</h1>
        <span className="sr-only">{AZ_COPY.messages.loading}</span>
        <div className="h-[680px] rounded-[22px] bg-[#e5dece]" />
      </div>
    );

  const counterpart =
    room.currentUserId === room.seller.id ? room.buyer : room.seller;
  const initials = counterpart.name.slice(0, 2).toUpperCase();

  return (
    <div className="container-shell py-8 md:py-10">
      <div className="overflow-hidden rounded-[22px] border border-[#d8cbb5] bg-[#fffaf0] shadow-card">
        {readError && (
          <p
            role="alert"
            className="border-b border-red-200 bg-red-50 p-3 text-center text-xs text-red-700"
          >
            {readError}
          </p>
        )}
        <div className="grid min-h-[680px] lg:grid-cols-[1fr_290px]">
          <section className="flex min-w-0 flex-col">
            <div className="flex min-h-[76px] items-center justify-between gap-3 border-b border-[#d8cbb5] px-3 py-2 sm:px-5">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link
                  href="/messages"
                  aria-label={AZ_COPY.chat.openMessages}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-[#f2eadb]"
                >
                  <ArrowLeft aria-hidden="true" size={18} />
                </Link>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-orange">
                  {initials}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold">
                    {counterpart.name}
                  </h1>
                  <Link
                    href={`/listings/${room.listing.id}`}
                    className="block truncate text-[11px] text-gray-600 hover:text-orange"
                  >
                    {room.listing.title}
                  </Link>
                </div>
              </div>
              <span className="pill shrink-0">
                <ShieldCheck
                  aria-hidden="true"
                  size={12}
                  className="text-orange"
                />
                {AZ_COPY.chat.private}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f6f0e5] p-4 md:p-7">
              <p className="mb-6 text-center text-[11px] font-bold leading-5 text-gray-600">
                {AZ_COPY.chat.trustNote}
              </p>
              {room.messages.length ? (
                <ol
                  className="space-y-3"
                  aria-label={AZ_COPY.chat.conversation}
                  aria-live="polite"
                  aria-relevant="additions"
                >
                  {room.messages.map((message) => {
                    const mine = message.sender_id === room.currentUserId;
                    return (
                      <li
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[86%] rounded-xl px-4 py-3 sm:max-w-[78%] ${mine ? "rounded-br-sm bg-ink text-[#fffaf0]" : "rounded-bl-sm border border-[#d8cbb5] bg-[#fffaf0]"}`}
                        >
                          <p className="break-words text-[13px] leading-5 [overflow-wrap:anywhere]">
                            {message.text}
                          </p>
                          <time
                            dateTime={message.created_at}
                            className={`mt-1 block text-right text-[10px] ${mine ? "text-[#c9bdab]" : "text-gray-500"}`}
                          >
                            {formatAzTime(message.created_at)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p
                  role="status"
                  className="py-12 text-center text-sm text-gray-600"
                >
                  {AZ_COPY.chat.empty}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={send}
              className="border-t border-[#d8cbb5] p-4"
              aria-busy={sending}
            >
              <label
                htmlFor="chat-message"
                className="mb-2 block text-xs font-bold"
              >
                {AZ_COPY.chat.messageLabel}
              </label>
              <div className="flex items-end gap-2">
                <textarea
                  id="chat-message"
                  className="input min-h-12 flex-1 resize-y py-3"
                  placeholder={AZ_COPY.chat.messagePlaceholder}
                  value={text}
                  maxLength={2000}
                  rows={2}
                  disabled={sending}
                  aria-describedby="chat-message-help chat-message-error"
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="btn-primary min-h-12 !px-4"
                  aria-label={
                    sending ? AZ_COPY.chat.sending : AZ_COPY.chat.send
                  }
                >
                  <Send aria-hidden="true" size={16} />
                </button>
              </div>
              <p
                id="chat-message-help"
                className="mt-2 text-[11px] text-gray-600"
              >
                {AZ_COPY.chat.messageHelp}
              </p>
              {sendError && (
                <p
                  id="chat-message-error"
                  role="alert"
                  className="mt-2 text-xs text-red-700"
                >
                  {sendError}
                </p>
              )}
            </form>
          </section>

          <aside className="hide-mobile border-l border-[#d8cbb5] p-6">
            <span className="eyebrow !text-[10px]">
              {AZ_COPY.chat.aboutBook}
            </span>
            <div className="mt-5 flex gap-4">
              <BookCover
                listing={room.listing}
                className="w-[78px] shrink-0 !p-2"
              />
              <div className="min-w-0">
                <b className="block break-words text-sm">
                  {room.listing.title}
                </b>
                <p className="mt-1 text-[11px] text-gray-600">
                  {room.listing.author}
                </p>
                <strong className="display mt-3 block text-xl text-orange">
                  {formatAzn(room.listing.price)}
                </strong>
              </div>
            </div>
            <div className="editorial-rule my-6" />
            <p className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin aria-hidden="true" size={14} />
              {formatCity(room.listing.city)}
            </p>
            <Link
              href={`/listings/${room.listing.id}`}
              className="btn-secondary mt-6 w-full"
            >
              {AZ_COPY.chat.viewListing}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
