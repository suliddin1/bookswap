"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

function isNotificationItem(value: unknown): value is NotificationItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.type === "MESSAGE" || value.type === "SYSTEM") &&
    typeof value.read === "boolean" &&
    typeof value.created_at === "string"
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
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems(null);
      setLoadFailed(false);
      return;
    }

    const controller = new AbortController();
    setLoadFailed(false);
    authFetch("/api/notifications", { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !isRecord(body)) throw new Error();
        const parsed = parseNotifications(body.data);
        if (!parsed) throw new Error();
        setItems(parsed);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setLoadFailed(true);
      });
    return () => controller.abort();
  }, [authLoading, user]);

  async function markAllRead() {
    if (marking) return;
    setMarking(true);
    setActionError("");
    setNotice("");
    try {
      const response = await authFetch("/api/notifications", {
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setActionError(
          localizeApiError(
            responseCode(body),
            AZ_COPY.notifications.markFailed,
          ),
        );
        return;
      }
      setItems(
        (current) =>
          current?.map((item) => ({ ...item, read: true })) ?? current,
      );
      setNotice(AZ_COPY.notifications.markedAllRead);
    } catch {
      setActionError(AZ_COPY.notifications.markFailed);
    } finally {
      setMarking(false);
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
      <div className="container-shell py-16">
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
          <h1 className="display mt-4 text-5xl font-semibold">
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
          >
            <CheckCheck aria-hidden="true" size={15} />
            {marking
              ? AZ_COPY.notifications.markingAllRead
              : AZ_COPY.notifications.markAllRead}
          </button>
        )}
      </div>

      {actionError && (
        <p role="alert" className="mt-4 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-xs font-bold text-green-800">
          {notice}
        </p>
      )}

      {items.length ? (
        <ul className="card mt-8 divide-y divide-[#e8dfcf] overflow-hidden">
          {items.map((item) => {
            const presentation = formatNotificationPresentation(
              item.type,
              item.payload,
            );
            const content = (
              <article
                className={`flex gap-4 p-5 ${item.read ? "opacity-75" : "bg-[#fffaf0]"}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eee3c8] text-orange">
                  <Bell aria-hidden="true" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{presentation.title}</b>
                    {!item.read && (
                      <span className="rounded-full bg-orange px-2 py-1 text-[10px] font-bold text-white">
                        {AZ_COPY.notifications.unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-gray-700 [overflow-wrap:anywhere]">
                    {presentation.body}
                  </p>
                  <time
                    dateTime={item.created_at}
                    className="mt-2 block text-[10px] text-gray-500"
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
