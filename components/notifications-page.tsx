"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAzDateTime,
  formatNotificationPresentation,
  localizeApiError,
} from "@/lib/i18n";

type NotificationItem = {
  id: string;
  type: "MESSAGE" | "SYSTEM";
  payload: unknown;
  read: boolean;
  created_at: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNotificationItem(value: unknown): value is NotificationItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.type === "MESSAGE" || value.type === "SYSTEM") &&
    typeof value.read === "boolean" &&
    isTimestamp(value.created_at)
  );
}

function parseNotifications(value: unknown): NotificationItem[] | null {
  return Array.isArray(value) && value.every(isNotificationItem) ? value : null;
}

function responseCode(value: unknown) {
  return isRecord(value) && typeof value.code === "string"
    ? value.code
    : undefined;
}

function payloadUuid(payload: unknown, key: string) {
  if (!isRecord(payload)) return undefined;
  const value = payload[key];
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? value
    : undefined;
}

function notificationHref(item: NotificationItem) {
  const roomId = payloadUuid(item.payload, "roomId");
  if (item.type === "MESSAGE" && roomId) return `/chat/${roomId}`;
  const listingId = payloadUuid(item.payload, "listingId");
  return item.type === "SYSTEM" && listingId
    ? `/listings/${listingId}`
    : undefined;
}

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [notificationData, setNotificationData] = useState<{
    ownerId: string;
    items: NotificationItem[];
  } | null>(null);
  const items =
    notificationData && notificationData.ownerId === userId
      ? notificationData.items
      : null;
  const [loadFailedForUserId, setLoadFailedForUserId] = useState<
    string | null
  >(null);
  const loadFailed = Boolean(
    userId && loadFailedForUserId === userId,
  );
  const [feedback, setFeedback] = useState<{
    ownerId: string;
    message: string;
    isError: boolean;
  } | null>(null);
  const visibleFeedback = feedback?.ownerId === userId ? feedback : null;
  const [markingForUserId, setMarkingForUserId] = useState<string | null>(
    null,
  );
  const marking = Boolean(userId && markingForUserId === userId);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setNotificationData(null);
      setLoadFailedForUserId(null);
      setFeedback(null);
      setMarkingForUserId(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setNotificationData(null);
    setLoadFailedForUserId(null);
    setFeedback(null);
    authFetch("/api/notifications", { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !isRecord(body)) throw new Error();
        const parsed = parseNotifications(body.data);
        if (!parsed) throw new Error();
        if (active) setNotificationData({ ownerId: userId, items: parsed });
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
    if (visibleFeedback && !marking)
      window.requestAnimationFrame(() => feedbackRef.current?.focus());
  }, [marking, visibleFeedback]);

  useEffect(() => {
    if (loadFailed) loadErrorRef.current?.focus();
  }, [loadFailed]);

  async function markAllRead() {
    if (!userId || marking) return;
    const requestUserId = userId;
    setMarkingForUserId(requestUserId);
    setFeedback(null);
    try {
      const response = await authFetch("/api/notifications", {
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setFeedback({
          ownerId: requestUserId,
          message: localizeApiError(
            responseCode(body),
            AZ_COPY.notifications.markFailed,
          ),
          isError: true,
        });
        return;
      }
      setNotificationData((current) =>
        current?.ownerId === requestUserId
          ? {
              ...current,
              items: current.items.map((item) => ({ ...item, read: true })),
            }
          : current,
      );
      setFeedback({
        ownerId: requestUserId,
        message: AZ_COPY.notifications.markedAllRead,
        isError: false,
      });
    } catch {
      setFeedback({
        ownerId: requestUserId,
        message: AZ_COPY.notifications.markFailed,
        isError: true,
      });
    } finally {
      setMarkingForUserId((current) =>
        current === requestUserId ? null : current,
      );
    }
  }

  if (!authLoading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.notifications.authTitle}
          body={AZ_COPY.notifications.authBody}
          action={AZ_COPY.notifications.signIn}
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
          title={AZ_COPY.notifications.unavailableTitle}
          body={AZ_COPY.notifications.unavailableBody}
          headingLevel="h1"
        />
      </div>
    );

  if (authLoading || !items)
    return (
      <div
        className="container-shell min-h-[600px] animate-pulse py-16"
        role="status"
        aria-busy="true"
      >
        <h1 className="sr-only">{AZ_COPY.notifications.title}</h1>
        <span className="sr-only">{AZ_COPY.notifications.loading}</span>
        <div className="h-28 rounded bg-[#e5dece]" />
      </div>
    );

  return (
    <div className="container-shell py-12 md:py-16">
      <div className="flex flex-col items-start gap-5 border-b-2 border-[#5b3c25] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="bookmark-badge">{AZ_COPY.notifications.badge}</span>
          <h1 className="display mt-4 break-words text-4xl font-semibold [overflow-wrap:anywhere] sm:text-5xl">
            {AZ_COPY.notifications.title}
          </h1>
        </div>
        {items.some((item) => !item.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="btn-secondary min-h-11"
            disabled={marking}
            aria-busy={marking}
            aria-controls="notifications-list"
          >
            <CheckCheck aria-hidden="true" size={15} />
            {marking
              ? AZ_COPY.notifications.markingAllRead
              : AZ_COPY.notifications.markAllRead}
          </button>
        )}
      </div>

      {visibleFeedback && (
        <p
          ref={feedbackRef}
          role={visibleFeedback.isError ? "alert" : "status"}
          aria-atomic="true"
          tabIndex={-1}
          className={`mt-4 text-xs focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213] ${visibleFeedback.isError ? "text-red-700" : "font-bold text-green-800"}`}
        >
          {visibleFeedback.message}
        </p>
      )}

      {items.length ? (
        <ul
          id="notifications-list"
          aria-label={AZ_COPY.notifications.listLabel}
          className="card mt-8 min-w-0 divide-y divide-[#d8cbb5]"
        >
          {items.map((item) => {
            const presentation = formatNotificationPresentation(
              item.type,
              item.payload,
            );
            const content = (
              <article
                className={`flex min-w-0 gap-4 rounded-xl p-5 max-[430px]:p-4 ${item.read ? "bg-[#f8f3e9]" : "bg-[#fffaf0]"}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eee3c8] text-orange">
                  <Bell aria-hidden="true" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{presentation.title}</b>
                    {!item.read && (
                      <span className="rounded-full bg-orange px-2 py-1 text-xs font-bold text-white">
                        {AZ_COPY.notifications.unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-gray-700 [overflow-wrap:anywhere]">
                    {presentation.body}
                  </p>
                  <time
                    dateTime={item.created_at}
                    className="mt-2 block text-xs text-[#6b6254]"
                  >
                    {formatAzDateTime(item.created_at)}
                  </time>
                </div>
              </article>
            );
            const href = notificationHref(item);
            return (
              <li key={item.id}>
                {href ? (
                  <Link
                    href={href}
                    className="block transition hover:bg-[#f2eadb]"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={AZ_COPY.notifications.emptyTitle}
            body={AZ_COPY.notifications.emptyBody}
          />
        </div>
      )}
    </div>
  );
}
