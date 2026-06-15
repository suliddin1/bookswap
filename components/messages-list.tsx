"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";

export function MessagesList() {
  const [rooms, setRooms] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { authFetch("/api/chat/rooms").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setRooms(body.data); }).catch((reason) => setError(reason.message)); }, []);
  if (error) return <div className="container-shell py-16"><EmptyState title="Sign in to read messages." body={error} action="Sign in" href="/login" /></div>;
  if (!rooms) return <div className="container-shell min-h-[600px] animate-pulse py-16"><div className="h-24 rounded-xl bg-[#e5dece]" /></div>;
  return <div className="container-shell py-12 md:py-16"><span className="eyebrow">Reader to reader</span><h1 className="display mt-4 text-5xl font-semibold">Messages.</h1>{rooms.length ? <div className="card mt-9 divide-y divide-[#e8dfcf] overflow-hidden">{rooms.map((room) => { const person = room.currentUserId === room.seller.id ? room.buyer : room.seller; return <Link key={room.id} href={`/chat/${room.id}`} className="flex items-center gap-4 p-5 transition hover:bg-[#f2eadb]"><BookCover listing={room.listing} className="w-12 shrink-0 !p-1" /><div className="min-w-0 flex-1"><b className="block text-xs">{person.name}</b><span className="mt-1 block truncate text-[9px] text-gray-500">{room.listing.title}</span></div><MessageCircle size={15} className="text-orange" /></Link>; })}</div> : <div className="mt-9"><EmptyState title="No conversations yet." body="Message a seller from any book detail page." action="Browse books" href="/listings" /></div>}</div>;
}
