"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { authFetch } from "@/lib/client-api";

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
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
        ({ new: message }) =>
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          ),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function sendMessage(text: string) {
    const response = await authFetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, text }),
    });
    return response.json();
  }

  return { messages, sendMessage };
}
