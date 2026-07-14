"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";

type Notification = {
  id: string;
  type: "MESSAGE" | "SYSTEM";
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    authFetch("/api/notifications")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setItems(body.data);
      })
      .catch((reason) => setError(reason.message));
  }, []);

  async function markAllRead() {
    setMarking(true);
    setActionError("");
    try {
      const response = await authFetch("/api/notifications", {
        method: "PATCH",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Could not mark notifications read.");
      setItems(
        (current) =>
          current?.map((item) => ({ ...item, read: true })) ?? current,
      );
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Could not mark notifications read.",
      );
    } finally {
      setMarking(false);
    }
  }

  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Sign in to see notifications."
          body={error}
          action="Sign in"
          href="/login"
        />
      </div>
    );
  if (!items)
    return (
      <div className="container-shell min-h-[600px] animate-pulse py-16">
        <div className="h-28 rounded bg-[#e5dece]" />
      </div>
    );

  return (
    <div className="container-shell py-12 md:py-16">
      <div className="flex items-end justify-between border-b-2 border-[#5b3c25] pb-6">
        <div>
          <span className="bookmark-badge">Account updates</span>
          <h1 className="display mt-4 text-5xl font-semibold">
            Notifications.
          </h1>
        </div>
        {items.some((item) => !item.read) && (
          <button
            onClick={markAllRead}
            className="btn-secondary"
            disabled={marking}
          >
            <CheckCheck size={14} />
            {marking ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>
      {actionError && (
        <p role="alert" className="mt-4 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {items.length ? (
        <div className="card mt-8 divide-y divide-[#e8dfcf] overflow-hidden">
          {items.map((item) => {
            const notification = (
              <article
                className={`flex gap-4 p-5 ${item.read ? "opacity-65" : "bg-[#fffaf0]"}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eee3c8] text-orange">
                  <Bell size={14} />
                </span>
                <div>
                  <b className="text-xs">
                    {item.type === "MESSAGE"
                      ? "New message"
                      : "BookSwap update"}
                  </b>
                  <p className="mt-1 text-[10px] leading-5 text-gray-600">
                    {String(
                      item.payload.preview ??
                        item.payload.message ??
                        "There is an update on your account.",
                    )}
                  </p>
                  <time className="mt-2 block text-[8px] text-gray-400">
                    {new Date(item.created_at).toLocaleString()}
                  </time>
                </div>
              </article>
            );
            const roomId = item.payload.roomId;
            return item.type === "MESSAGE" && typeof roomId === "string" ? (
              <Link
                key={item.id}
                href={`/chat/${roomId}`}
                className="block transition hover:bg-[#f2eadb]"
              >
                {notification}
              </Link>
            ) : (
              <div key={item.id}>{notification}</div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="You are all caught up."
            body="Messages, moderation decisions, and important account updates will appear here."
          />
        </div>
      )}
    </div>
  );
}
