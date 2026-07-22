"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function useNotifications(userId?: string) {
  const [ownedUnreadIds, setOwnedUnreadIds] = useState<{
    ownerId: string;
    ids: string[];
  } | null>(null);
  const unreadIds =
    ownedUnreadIds && ownedUnreadIds.ownerId === userId
      ? ownedUnreadIds.ids
      : [];
  const latestEvents = useRef(new Map<string, boolean>());

  useEffect(() => {
    const supabase = getSupabaseClient();
    latestEvents.current = new Map();
    setOwnedUnreadIds(null);
    if (!supabase || !userId) return;
    let active = true;

    const apply = (item: { id: string; read: boolean; user_id: string }) => {
      if (!active || item.user_id !== userId) return;
      latestEvents.current.set(item.id, !item.read);
      setOwnedUnreadIds((current) => {
        const next = new Set(
          current?.ownerId === userId ? current.ids : [],
        );
        if (item.read) next.delete(item.id);
        else next.add(item.id);
        return { ownerId: userId, ids: Array.from(next) };
      });
    };

    const load = async () => {
      latestEvents.current = new Map();
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("read", false);
      if (!active) return;
      if (error) {
        console.error("Notification count failed to load", error);
        return;
      }
      const next = new Set((data ?? []).map((item) => item.id));
      for (const [id, unread] of Array.from(latestEvents.current.entries())) {
        if (unread) next.add(id);
        else next.delete(id);
      }
      setOwnedUnreadIds({ ownerId: userId, ids: Array.from(next) });
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: item }) =>
          apply(item as { id: string; read: boolean; user_id: string }),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: item }) =>
          apply(item as { id: string; read: boolean; user_id: string }),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void load();
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    unread: unreadIds.length,
  };
}
