"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).then(({ data }) => setNotifications(data ?? []));
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, ({ new: item }) => setNotifications((current) => [item, ...current]))
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, unread: notifications.filter((item) => !item.read).length };
}
