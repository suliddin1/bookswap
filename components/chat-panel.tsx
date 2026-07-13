"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, MapPin, Send, ShieldCheck } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";
import { getSupabaseClient } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

type Message = {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
};
type Room = {
  listing: Listing;
  buyer: any;
  seller: any;
  messages: Message[];
  currentUserId: string;
};

export function ChatPanel({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`/api/chat/rooms/${roomId}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setRoom(body.data);
      })
      .catch((reason) => setError(reason.message));
  }, [roomId]);

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
        ({ new: message }) => {
          setRoom((current) =>
            current && !current.messages.some((item) => item.id === message.id)
              ? {
                  ...current,
                  messages: [...current.messages, message as Message],
                }
              : current,
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function send() {
    if (!text.trim() || !room) return;
    const value = text.trim();
    setText("");
    const response = await authFetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, text: value }),
    });
    const body = await response.json();
    if (response.ok)
      setRoom({ ...room, messages: [...room.messages, body.data] });
    else setError(body.error);
  }

  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Conversation unavailable."
          body={error}
          action="Sign in"
          href="/login"
        />
      </div>
    );
  if (!room)
    return (
      <div className="container-shell min-h-[680px] animate-pulse py-10">
        <div className="h-[680px] rounded-[22px] bg-[#e5dece]" />
      </div>
    );
  const counterpart =
    room.currentUserId === room.seller.id ? room.buyer : room.seller;

  return (
    <div className="container-shell py-8 md:py-10">
      <div className="overflow-hidden rounded-[22px] border border-[#d8cbb5] bg-[#fffaf0] shadow-card">
        <div className="grid min-h-[680px] lg:grid-cols-[1fr_290px]">
          <section className="flex min-w-0 flex-col">
            <div className="flex h-[72px] items-center justify-between border-b border-[#d8cbb5] px-5">
              <div className="flex items-center gap-3">
                <Link href={`/listings/${room.listing.id}`}>
                  <ArrowLeft size={16} />
                </Link>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[10px] font-bold text-orange">
                  {counterpart.name?.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <b className="block text-xs">{counterpart.name}</b>
                  <span className="text-[9px] text-gray-500">
                    BookSwap conversation
                  </span>
                </div>
              </div>
              <span className="pill">
                <ShieldCheck size={11} className="text-orange" /> Private
              </span>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#f6f0e5] p-5 md:p-7">
              <p className="mb-6 text-center text-[8px] font-bold uppercase tracking-[.15em] text-gray-400">
                Discuss the book and arrange a safe exchange
              </p>
              <div className="space-y-3">
                {room.messages.map((message) => {
                  const mine = message.sender_id === room.currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-xl px-4 py-3 ${mine ? "rounded-br-sm bg-ink text-[#fffaf0]" : "rounded-bl-sm border border-[#d8cbb5] bg-[#fffaf0]"}`}
                      >
                        <p className="text-[11px] leading-5">{message.text}</p>
                        <span
                          className={`mt-1 flex items-center justify-end gap-1 text-[8px] ${mine ? "text-[#c9bdab]" : "text-gray-400"}`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {mine && <CheckCheck size={10} />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-[#d8cbb5] p-4">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Write a message..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && send()}
                />
                <button onClick={send} className="btn-primary !px-4">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </section>
          <aside className="hide-mobile border-l border-[#d8cbb5] p-6">
            <span className="eyebrow !text-[8px]">About this book</span>
            <div className="mt-5 flex gap-4">
              <BookCover
                listing={room.listing}
                className="w-[78px] shrink-0 !p-2"
              />
              <div>
                <b className="text-xs">{room.listing.title}</b>
                <p className="mt-1 text-[9px] text-gray-500">
                  {room.listing.author}
                </p>
                <strong className="display mt-3 block text-xl text-orange">
                  ₼{room.listing.price}
                </strong>
              </div>
            </div>
            <div className="editorial-rule my-6" />
            <p className="flex items-center gap-2 text-[10px] text-gray-500">
              <MapPin size={12} /> {room.listing.city}
            </p>
            <Link
              href={`/listings/${room.listing.id}`}
              className="btn-secondary mt-6 w-full"
            >
              View listing
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
