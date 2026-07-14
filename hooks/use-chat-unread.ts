"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type ChatReadState = {
  room_id: string;
  user_id: string;
  unread_count: number;
  updated_at: string;
};

export function useChatUnread(userId?: string) {
  const [states, setStates] = useState<Record<string, ChatReadState>>({});
  const latestEvents = useRef(new Map<string, ChatReadState>());

  useEffect(() => {
    const supabase = getSupabaseClient();
    latestEvents.current = new Map();
    setStates({});
    if (!supabase || !userId) return;
    let active = true;

    const apply = (state: ChatReadState) => {
      if (!active || state.user_id !== userId) return;
      latestEvents.current.set(state.room_id, state);
      setStates((current) => ({ ...current, [state.room_id]: state }));
    };

    const load = async () => {
      latestEvents.current = new Map();
      const { data, error } = await supabase
        .from("chat_room_reads")
        .select("room_id,user_id,unread_count,updated_at")
        .eq("user_id", userId)
        .gt("unread_count", 0);
      if (!active) return;
      if (error) {
        console.error("Chat unread state failed to load", error);
        return;
      }
      const next = Object.fromEntries(
        (data ?? []).map((state) => [state.room_id, state]),
      );
      for (const [roomId, state] of Array.from(
        latestEvents.current.entries(),
      )) {
        const loaded = next[roomId];
        if (!loaded || loaded.updated_at <= state.updated_at)
          next[roomId] = state;
      }
      setStates(next);
    };

    const channel = supabase
      .channel(`chat-unread:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_room_reads",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: state }) => apply(state as ChatReadState),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_room_reads",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: state }) => apply(state as ChatReadState),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void load();
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return Object.values(states).reduce(
    (total, state) => total + state.unread_count,
    0,
  );
}
