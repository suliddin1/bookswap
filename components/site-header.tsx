"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChatUnread } from "@/hooks/use-chat-unread";
import { useNotifications } from "@/hooks/use-notifications";
import { AZ_COPY } from "@/lib/i18n";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const { user, signOut } = useAuth();
  const { unread } = useNotifications(user?.id);
  const unreadChats = useChatUnread(user?.id);
  const initials = String(user?.user_metadata?.name ?? user?.email ?? "R")
    .split(/[\s@]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;

    firstMobileLinkRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function currentPage(href: string) {
    if (href === "/") return pathname === href ? "page" : undefined;
    if (href === "/listings") {
      return pathname === href ||
        (pathname.startsWith("/listings/") &&
          !pathname.startsWith("/listings/new"))
        ? "page"
        : undefined;
    }
    return pathname === href || pathname.startsWith(`${href}/`)
      ? "page"
      : undefined;
  }

  return (
    <header className="bg-[#f8f3e9]/92 sticky top-0 z-50 border-b border-[#d8cbb5] backdrop-blur-xl">
      <div className="container-shell flex h-[74px] items-center justify-between gap-5">
        <Link
          href="/"
          aria-label={`BookSwap — ${AZ_COPY.navigation.home}`}
          aria-current={currentPage("/")}
          className="flex min-h-11 items-center gap-2 text-lg font-black tracking-tight"
        >
          <span className="grid h-8 w-8 -rotate-3 place-items-center rounded-lg bg-ink text-orange">
            <BookOpen size={18} strokeWidth={2.5} />
          </span>
          <span className="display text-xl max-[360px]:sr-only">
            Book<span className="text-orange">Swap</span>
          </span>
        </Link>

        <nav
          aria-label={AZ_COPY.navigation.menu}
          className="hidden items-center gap-3 text-xs font-extrabold uppercase tracking-[.09em] min-[1101px]:flex"
        >
          <Link
            href="/"
            aria-current={currentPage("/")}
            className="inline-flex min-h-11 items-center px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.home}
          </Link>
          <Link
            href="/listings"
            aria-current={currentPage("/listings")}
            className="inline-flex min-h-11 items-center px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.browse}
          </Link>
          <Link
            href="/listings/new"
            aria-current={currentPage("/listings/new")}
            className="inline-flex min-h-11 items-center px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.sell}
          </Link>
          <Link
            href="/messages"
            aria-current={currentPage("/messages")}
            aria-label={`${AZ_COPY.navigation.messages}: ${unreadChats} oxunmamış mesaj`}
            className="flex min-h-11 items-center gap-1.5 px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.messages}
            {unreadChats > 0 && (
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-orange px-1 text-xs text-white">
                {unreadChats > 9 ? "9+" : unreadChats}
              </span>
            )}
          </Link>
          <Link
            href="/favorites"
            aria-current={currentPage("/favorites")}
            className="inline-flex min-h-11 items-center px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.favorites}
          </Link>
          <Link
            href="/profile"
            aria-current={currentPage("/profile")}
            className="inline-flex min-h-11 items-center px-1 transition hover:text-orange"
          >
            {AZ_COPY.navigation.dashboard}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 min-[1101px]:flex">
          <Link
            href="/listings"
            aria-label={AZ_COPY.navigation.search}
            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white"
          >
            <Search size={17} />
          </Link>
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-current={currentPage("/notifications")}
                aria-label={`${AZ_COPY.navigation.notifications}: ${unread} oxunmamış bildiriş`}
                className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white"
              >
                <Bell size={15} />
                {unread > 0 && (
                  <span className="absolute right-0 top-0 grid h-6 min-w-6 place-items-center rounded-full bg-orange px-1 text-xs font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                aria-current={currentPage("/profile")}
                aria-label={AZ_COPY.navigation.dashboard}
                className="ml-1 grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-extrabold text-orange"
              >
                {initials}
              </Link>
              <button
                onClick={signOut}
                aria-label={AZ_COPY.navigation.signOut}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-white"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              aria-current={currentPage("/login")}
              className="btn-secondary ml-2 !min-h-11 !px-4"
            >
              {AZ_COPY.navigation.signIn}
            </Link>
          )}
        </div>

        <button
          ref={menuButtonRef}
          className="grid h-11 w-11 place-items-center rounded-full min-[1101px]:hidden"
          onClick={() => setOpen(!open)}
          aria-label={AZ_COPY.navigation.menu}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div
          id="mobile-navigation"
          className="border-t border-[#e8e5df] bg-paper px-5 py-5 min-[1101px]:hidden"
        >
          <nav
            aria-label={AZ_COPY.navigation.menu}
            className="flex flex-col text-sm font-extrabold"
          >
            <Link
              ref={firstMobileLinkRef}
              href="/"
              aria-current={currentPage("/")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              {AZ_COPY.navigation.home}
            </Link>
            <Link
              href="/listings"
              aria-current={currentPage("/listings")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              {AZ_COPY.navigation.browse}
            </Link>
            <Link
              href="/listings/new"
              aria-current={currentPage("/listings/new")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              {AZ_COPY.navigation.sell}
            </Link>
            <Link
              href="/messages"
              aria-current={currentPage("/messages")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              <MessageCircle className="inline" size={14} />{" "}
              {AZ_COPY.navigation.messages}
              {unreadChats ? ` (${unreadChats})` : ""}
            </Link>
            <Link
              href="/favorites"
              aria-current={currentPage("/favorites")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              <Heart className="inline" size={14} />{" "}
              {AZ_COPY.navigation.favorites}
            </Link>
            <Link
              href="/notifications"
              aria-current={currentPage("/notifications")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              <Bell className="inline" size={14} />{" "}
              {AZ_COPY.navigation.notifications}
              {unread ? ` (${unread})` : ""}
            </Link>
            <Link
              href="/profile"
              aria-current={currentPage("/profile")}
              className="flex min-h-11 items-center"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="inline" size={14} />{" "}
              {AZ_COPY.navigation.dashboard}
            </Link>
            {!user && (
              <Link
                href="/login"
                aria-current={currentPage("/login")}
                className="flex min-h-11 items-center"
                onClick={() => setOpen(false)}
              >
                {AZ_COPY.navigation.signIn}
              </Link>
            )}
            <Link
              href="/listings/new"
              className="btn-primary mt-2"
              onClick={() => setOpen(false)}
            >
              <Plus size={14} /> {AZ_COPY.navigation.sellBook}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
