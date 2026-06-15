"use client";

import Link from "next/link";
import { BookOpen, Heart, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const initials = String(user?.user_metadata?.name ?? user?.email ?? "R").split(/[\s@]/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8cbb5] bg-[#f8f3e9]/92 backdrop-blur-xl">
      <div className="container-shell flex h-[74px] items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span className="grid h-8 w-8 -rotate-3 place-items-center rounded-lg bg-ink text-orange">
            <BookOpen size={18} strokeWidth={2.5} />
          </span>
          <span className="display text-xl">Book<span className="text-orange">Swap</span></span>
        </Link>

        <nav className="hide-mobile flex items-center gap-5 text-[10px] font-extrabold uppercase tracking-[.09em]">
          <Link href="/" className="transition hover:text-orange">Home</Link>
          <Link href="/listings" className="transition hover:text-orange">Browse</Link>
          <Link href="/listings/new" className="transition hover:text-orange">Sell</Link>
          <Link href="/messages" className="transition hover:text-orange">Messages</Link>
          <Link href="/favorites" className="transition hover:text-orange">Favorites</Link>
          <Link href="/profile" className="transition hover:text-orange">Dashboard</Link>
        </nav>

        <div className="hide-mobile flex items-center gap-2">
          <Link href="/listings" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white">
            <Search size={17} />
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-ink text-xs font-extrabold text-orange">{initials}</Link>
              <button onClick={signOut} aria-label="Sign out" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white"><LogOut size={15} /></button>
            </>
          ) : <Link href="/login" className="btn-secondary ml-2 !min-h-[42px] !px-4">Sign in</Link>}
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-full md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[#e8e5df] bg-paper px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-extrabold">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/listings" onClick={() => setOpen(false)}>Browse</Link>
            <Link href="/listings/new" onClick={() => setOpen(false)}>Sell</Link>
            <Link href="/messages" onClick={() => setOpen(false)}><MessageCircle className="inline" size={14} /> Messages</Link>
            <Link href="/favorites" onClick={() => setOpen(false)}><Heart className="inline" size={14} /> Favorites</Link>
            <Link href="/profile" onClick={() => setOpen(false)}><LayoutDashboard className="inline" size={14} /> Dashboard</Link>
            {!user && <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>}
            <Link href="/listings/new" className="btn-primary mt-2" onClick={() => setOpen(false)}><Plus size={14} /> Sell a book</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
