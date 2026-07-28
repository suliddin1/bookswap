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
  formatAzDateTime,
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
  const userId = user?.id;
  const contextKey = userId ? `${userId}:${roomId}` : null;
  const [roomData, setRoomData] = useState<{
    contextKey: string;
    room: ChatRoomDetail;
  } | null>(null);
  const room = roomData?.contextKey === contextKey ? roomData.room : null;
  const [draft, setDraft] = useState<{
    contextKey: string;
    value: string;
  } | null>(null);
  const text = draft?.contextKey === contextKey ? draft.value : "";
  const [loadFailedForContext, setLoadFailedForContext] = useState<
    string | null
  >(null);
  const loadFailed = Boolean(contextKey && loadFailedForContext === contextKey);
  const [sendErrorState, setSendErrorState] = useState<{
    contextKey: string;
    message: string;
  } | null>(null);
  const sendError =
    sendErrorState?.contextKey === contextKey ? sendErrorState.message : "";
  const [readErrorState, setReadErrorState] = useState<{
    contextKey: string;
    message: string;
  } | null>(null);
  const readError =
    readErrorState?.contextKey === contextKey ? readErrorState.message : "";
  const [sendingForContext, setSendingForContext] = useState<string | null>(
    null,
  );
  const sending = Boolean(contextKey && sendingForContext === contextKey);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const activeContextRef = useRef(contextKey);
  activeContextRef.current = contextKey;
  const stickToBottomRef = useRef(true);
  const previousContextRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);

  const markRead = useCallback(async () => {
    if (!userId || !contextKey) return;
    const requestContext = contextKey;
    try {
      const response = await authFetch(`/api/chat/rooms/${roomId}`, {
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (activeContextRef.current !== requestContext) return;
      if (!response.ok)
        throw new Error(
          localizeApiError(responseCode(body), AZ_COPY.chat.readFailed),
        );
      setReadErrorState((current) =>
        current?.contextKey === requestContext ? null : current,
      );
    } catch {
      if (activeContextRef.current !== requestContext) return;
      setReadErrorState({
        contextKey: requestContext,
        message: AZ_COPY.chat.readFailed,
      });
    }
  }, [contextKey, roomId, userId]);

  const fetchRoom = useCallback(
    async (expectedUserId: string, signal?: AbortSignal) => {
      const response = await authFetch(`/api/chat/rooms/${roomId}`, { signal });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error();
      const parsed = parseChatRoomDetail(responseData(body));
      if (!parsed || parsed.currentUserId !== expectedUserId) throw new Error();
      return parsed;
    },
    [roomId],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!userId || !contextKey) {
      setRoomData(null);
      setDraft(null);
      setLoadFailedForContext(null);
      setSendErrorState(null);
      setReadErrorState(null);
      setSendingForContext(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const requestContext = contextKey;
    setRoomData(null);
    setDraft(null);
    setLoadFailedForContext(null);
    setSendErrorState(null);
    setReadErrorState(null);
    setSendingForContext(null);
    fetchRoom(userId, controller.signal)
      .then((nextRoom) => {
        if (!active) return;
        setRoomData({ contextKey: requestContext, room: nextRoom });
        if (document.visibilityState === "visible" && document.hasFocus())
          void markRead();
      })
      .catch((reason: unknown) => {
        if (
          active &&
          !(reason instanceof DOMException && reason.name === "AbortError")
        )
          setLoadFailedForContext(requestContext);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, contextKey, fetchRoom, markRead, userId]);

  const roomReady = Boolean(room);
  useEffect(() => {
    if (!userId || !contextKey || !roomReady) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const requestContext = contextKey;
    let active = true;
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
          if (!active) return;
          const message = parseChatMessage(value);
          if (!message) return;
          setRoomData((current) =>
            current?.contextKey === requestContext &&
            !current.room.messages.some((item) => item.id === message.id)
              ? {
                  ...current,
                  room: {
                    ...current.room,
                    messages: [...current.room.messages, message],
                  },
                }
              : current,
          );
          if (document.visibilityState === "visible" && document.hasFocus())
            void markRead();
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (subscribedOnce) {
          void fetchRoom(userId)
            .then((nextRoom) => {
              if (!active) return;
              setRoomData({ contextKey: requestContext, room: nextRoom });
              if (document.visibilityState === "visible" && document.hasFocus())
                void markRead();
            })
            .catch(() => {
              if (active) setLoadFailedForContext(requestContext);
            });
        }
        subscribedOnce = true;
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [contextKey, fetchRoom, markRead, roomId, roomReady, userId]);

  useEffect(() => {
    if (!userId || !roomReady) return;
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
  }, [markRead, roomReady, userId]);

  useEffect(() => {
    const messageCount = room?.messages.length ?? 0;
    const contextChanged = previousContextRef.current !== contextKey;
    if (contextChanged) {
      previousContextRef.current = contextKey;
      previousMessageCountRef.current = 0;
      stickToBottomRef.current = true;
    }
    const transcript = transcriptRef.current;
    if (
      transcript &&
      room &&
      (stickToBottomRef.current || previousMessageCountRef.current === 0)
    )
      transcript.scrollTop = transcript.scrollHeight;
    previousMessageCountRef.current = messageCount;
  }, [contextKey, room?.messages.length, room]);

  useEffect(() => {
    if (loadFailed) loadErrorRef.current?.focus();
  }, [loadFailed]);

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const value = text.trim();
    if (!value || !room || !contextKey || sending) return;

    const requestContext = contextKey;
    setSendingForContext(requestContext);
    setSendErrorState(null);
    try {
      const response = await authFetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, text: value }),
      });
      const body: unknown = await response.json();
      if (activeContextRef.current !== requestContext) return;
      if (!response.ok) {
        setSendErrorState({
          contextKey: requestContext,
          message: localizeApiError(
            responseCode(body),
            AZ_COPY.chat.sendFailed,
          ),
        });
        return;
      }
      const message = parseChatMessage(responseData(body));
      if (!message) {
        setSendErrorState({
          contextKey: requestContext,
          message: AZ_COPY.chat.sendFailed,
        });
        return;
      }
      stickToBottomRef.current = true;
      setRoomData((current) =>
        current?.contextKey === requestContext &&
        !current.room.messages.some((item) => item.id === message.id)
          ? {
              ...current,
              room: {
                ...current.room,
                messages: [...current.room.messages, message],
              },
            }
          : current,
      );
      setDraft((current) =>
        current?.contextKey === requestContext ? null : current,
      );
    } catch {
      if (activeContextRef.current !== requestContext) return;
      setSendErrorState({
        contextKey: requestContext,
        message: AZ_COPY.chat.sendFailed,
      });
    } finally {
      setSendingForContext((current) =>
        current === requestContext ? null : current,
      );
      if (activeContextRef.current === requestContext)
        window.requestAnimationFrame(() => composerRef.current?.focus());
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
      <div
        ref={loadErrorRef}
        className="container-shell py-16"
        role="alert"
        tabIndex={-1}
      >
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
      <div className="rounded-[22px] border border-[#d8cbb5] bg-[#fffaf0] shadow-card">
        {readError && (
          <p
            role="alert"
            className="border-b border-red-200 bg-red-50 p-3 text-center text-xs text-red-700"
          >
            {readError}
          </p>
        )}
        <div className="grid min-h-[680px] lg:grid-cols-[1fr_290px]">
          <section
            aria-labelledby="chat-title"
            className="flex min-w-0 flex-col"
          >
            <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[#d8cbb5] px-3 py-2 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <Link
                  href="/messages"
                  aria-label={AZ_COPY.chat.openMessages}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-[#f2eadb]"
                >
                  <ArrowLeft aria-hidden="true" size={18} />
                </Link>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-[#f0c66b]">
                  {initials}
                </span>
                <div className="min-w-0">
                  <h1
                    id="chat-title"
                    className="break-words text-sm font-bold [overflow-wrap:anywhere]"
                  >
                    {counterpart.name}
                  </h1>
                  <Link
                    href={`/listings/${room.listing.id}`}
                    className="inline-flex min-h-6 items-center break-words text-xs text-[#6b6254] [overflow-wrap:anywhere] hover:text-[#8f6213]"
                  >
                    {room.listing.title}
                  </Link>
                </div>
              </div>
              <span className="pill max-w-full shrink-0 !text-xs">
                <ShieldCheck
                  aria-hidden="true"
                  size={12}
                  className="text-orange"
                />
                {AZ_COPY.chat.private}
              </span>
            </div>

            <div
              ref={transcriptRef}
              role="log"
              aria-label={AZ_COPY.chat.conversation}
              aria-live="polite"
              aria-relevant="additions"
              aria-atomic="false"
              tabIndex={0}
              onScroll={(event) => {
                const transcript = event.currentTarget;
                stickToBottomRef.current =
                  transcript.scrollHeight -
                    transcript.scrollTop -
                    transcript.clientHeight <=
                  48;
              }}
              className="max-h-[min(58vh,560px)] min-h-[280px] flex-1 overflow-y-auto bg-[#f6f0e5] p-4 md:p-7"
            >
              <p className="mb-6 text-center text-xs font-bold leading-5 text-[#6b6254]">
                {AZ_COPY.chat.trustNote}
              </p>
              {room.messages.length ? (
                <ol className="space-y-3">
                  {room.messages.map((message) => {
                    const mine = message.sender_id === room.currentUserId;
                    return (
                      <li
                        key={message.id}
                        className={`flex min-w-0 ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`min-w-0 max-w-full rounded-xl px-4 py-3 sm:max-w-[78%] ${mine ? "rounded-br-sm bg-ink text-[#fffaf0]" : "rounded-bl-sm border border-[#d8cbb5] bg-[#fffaf0]"}`}
                        >
                          <p className="break-words text-sm leading-5 [overflow-wrap:anywhere]">
                            <span className="sr-only">
                              {mine ? AZ_COPY.chat.you : counterpart.name}:{" "}
                            </span>
                            {message.text}
                          </p>
                          <time
                            dateTime={message.created_at}
                            aria-label={formatAzDateTime(message.created_at)}
                            className={`mt-1 block text-right text-xs ${mine ? "text-[#c9bdab]" : "text-[#6b6254]"}`}
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
              <div className="flex items-end gap-2 max-[430px]:flex-col max-[430px]:items-stretch">
                <textarea
                  ref={composerRef}
                  id="chat-message"
                  className="input min-h-12 min-w-0 flex-1 resize-y py-3"
                  placeholder={AZ_COPY.chat.messagePlaceholder}
                  value={text}
                  maxLength={2000}
                  rows={2}
                  disabled={sending}
                  aria-invalid={Boolean(sendError)}
                  aria-describedby={
                    sendError
                      ? "chat-message-help chat-message-error"
                      : "chat-message-help"
                  }
                  onChange={(event) => {
                    if (contextKey)
                      setDraft({
                        contextKey,
                        value: event.target.value,
                      });
                    setSendErrorState((current) =>
                      current?.contextKey === contextKey ? null : current,
                    );
                  }}
                  onKeyDown={handleComposerKeyDown}
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="btn-primary min-h-12 !px-4 max-[430px]:w-full"
                  aria-label={
                    sending ? AZ_COPY.chat.sending : AZ_COPY.chat.send
                  }
                >
                  <Send aria-hidden="true" size={16} />
                </button>
              </div>
              <p id="chat-message-help" className="mt-2 text-xs text-[#6b6254]">
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
            <span className="eyebrow !text-xs">{AZ_COPY.chat.aboutBook}</span>
            <div className="mt-5 flex gap-4">
              <BookCover
                listing={room.listing}
                className="w-[78px] shrink-0 !p-2"
                sizes="78px"
              />
              <div className="min-w-0">
                <b className="block break-words text-sm">
                  {room.listing.title}
                </b>
                <p className="mt-1 break-words text-xs text-[#6b6254] [overflow-wrap:anywhere]">
                  {room.listing.author}
                </p>
                <strong className="display mt-3 block text-xl text-orange">
                  {formatAzn(room.listing.price)}
                </strong>
              </div>
            </div>
            <div className="editorial-rule my-6" />
            <p className="flex items-center gap-2 text-xs text-[#6b6254]">
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
