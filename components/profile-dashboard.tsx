"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Check,
  Edit3,
  Heart,
  MessageCircle,
  Plus,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY, formatCity, localizeApiError } from "@/lib/i18n";
import type { Listing } from "@/lib/types";
import type { FormEvent, ReactNode } from "react";

const tabs = [
  ["listings", AZ_COPY.profile.tabs.listings, BookOpen],
  ["messages", AZ_COPY.profile.tabs.messages, MessageCircle],
  ["favorites", AZ_COPY.profile.tabs.favorites, Heart],
  ["requests", AZ_COPY.profile.tabs.requests, ShoppingBag],
  ["profile", AZ_COPY.profile.tabs.profile, UserRound],
] as const;

type TabId = (typeof tabs)[number][0];

type ProfileRecord = {
  name: string;
  phone: string | null;
  city: string | null;
};

type DashboardData = {
  profile: ProfileRecord;
  listings: Listing[];
  favoriteCount: number;
};

export function ProfileDashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<TabId>("listings");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);

  async function removeListing(id: string) {
    if (!window.confirm(AZ_COPY.profile.deleteConfirm)) return;
    setBusyListingId(id);
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/listings/${id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.profile.deleteFailed),
        );
      setData((current) =>
        current
          ? {
              ...current,
              listings: current.listings.filter((item) => item.id !== id),
            }
          : current,
      );
      setNotice(
        body.imageCleanupPending
          ? AZ_COPY.profile.deleteCleanupPending
          : AZ_COPY.profile.deleteComplete,
      );
    } catch {
      setError(AZ_COPY.profile.deleteFailed);
    } finally {
      setBusyListingId(null);
    }
  }

  async function setListingStatus(id: string, status: "active" | "sold") {
    setBusyListingId(id);
    setError("");
    setNotice("");
    try {
      const response = await authFetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.profile.statusFailed),
        );
      setData((current) =>
        current
          ? {
              ...current,
              listings: current.listings.map((item) =>
                item.id === id ? body.data : item,
              ),
            }
          : current,
      );
      setNotice(AZ_COPY.profile.statusUpdated);
    } catch {
      setError(AZ_COPY.profile.statusFailed);
    } finally {
      setBusyListingId(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || profileBusy) return;
    setProfileBusy(true);
    setProfileSaved(false);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await authFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: form.get("city"),
          phone: form.get("phone") || null,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.profile.profileSaveFailed),
        );
      setData({ ...data, profile: body.data });
      setProfileSaved(true);
    } catch {
      setError(AZ_COPY.profile.profileSaveFailed);
    } finally {
      setProfileBusy(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setError("");
    void authFetch("/api/profile", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            localizeApiError(body.code, AZ_COPY.profile.unavailableBody),
          );
        if (active) setData(body.data);
      })
      .catch((reason) => {
        if (active && reason?.name !== "AbortError")
          setError(AZ_COPY.profile.unavailableBody);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [user]);

  if (!loading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.profile.authTitle}
          body={AZ_COPY.profile.authBody}
          action={AZ_COPY.profile.signIn}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );

  if (error && !data)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.profile.unavailableTitle}
          body={AZ_COPY.profile.unavailableBody}
          action={AZ_COPY.profile.signInAgain}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );

  if (!data)
    return (
      <div
        className="container-shell min-h-[650px] animate-pulse py-16"
        role="status"
        aria-label={AZ_COPY.profile.loading}
      >
        <h1 className="sr-only">{AZ_COPY.profile.loading}</h1>
        <div className="h-32 rounded bg-[#e5dece]" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded bg-[#e5dece]" />
          ))}
        </div>
      </div>
    );

  const name = data.profile.name || user?.email || AZ_COPY.profile.reader;
  const firstName = name.trim().split(/\s+/)[0] || AZ_COPY.profile.reader;
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const active = data.listings.filter(
    (item) => item.status === "active",
  ).length;
  const sold = data.listings.filter((item) => item.status === "sold").length;

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 border-b-2 border-[#5b3c25] pb-6 md:flex-row md:items-end">
        <div>
          <span className="bookmark-badge">{AZ_COPY.profile.badge}</span>
          <h1 className="display mt-4 text-5xl font-semibold">
            {AZ_COPY.profile.welcome(firstName)}
          </h1>
        </div>
        <Link href="/listings/new" className="btn-primary">
          <Plus size={14} /> {AZ_COPY.profile.createListing}
        </Link>
      </div>

      <div className="grid gap-7 lg:grid-cols-[210px_1fr]">
        <aside className="catalog-drawer h-fit rounded-sm p-4">
          <div className="flex items-center gap-3 border-b border-[#cfbea0] pb-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-bold text-orange">
              {initials}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-xs">{name}</b>
              <span className="block truncate text-[10px] text-gray-500">
                {data.profile.city
                  ? formatCity(data.profile.city)
                  : AZ_COPY.profile.locationNotSet}
              </span>
            </div>
          </div>
          <nav
            className="mt-3 divide-y divide-[#d8c8a9]"
            aria-label={AZ_COPY.profile.navigationLabel}
          >
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                aria-current={tab === id ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 py-3 text-left text-xs font-bold transition ${tab === id ? "text-orange" : "text-gray-600 hover:pl-1"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main id="profile-dashboard-content">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={AZ_COPY.profile.activeListings} value={active} />
            <Stat label={AZ_COPY.profile.soldBooks} value={sold} />
            <Stat
              label={AZ_COPY.profile.savedBooks}
              value={data.favoriteCount}
            />
            <Stat
              label={AZ_COPY.profile.totalListings}
              value={data.listings.length}
            />
          </section>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="mt-5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800"
            >
              {notice}
            </p>
          )}

          {tab === "listings" && (
            <DashboardSection
              title={AZ_COPY.profile.listingsTitle}
              icon={BookOpen}
            >
              {data.listings.length ? (
                <div className="shelf-row grid grid-cols-2 gap-8 md:grid-cols-3">
                  {data.listings.map((listing) => {
                    const listingBusy = busyListingId === listing.id;
                    const nextStatus =
                      listing.status === "active"
                        ? "sold"
                        : listing.status === "sold" ||
                            listing.status === "draft"
                          ? "active"
                          : null;
                    const statusAction =
                      listing.status === "active"
                        ? AZ_COPY.profile.markSold
                        : listing.status === "sold"
                          ? AZ_COPY.profile.relist
                          : AZ_COPY.profile.publish;

                    return (
                      <div key={listing.id} aria-busy={listingBusy}>
                        <BookCard listing={listing} />
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/listings/${listing.id}/edit`}
                            className="btn-secondary !min-h-11 flex-1 !px-3 !text-[10px]"
                          >
                            <Edit3 size={12} /> {AZ_COPY.profile.edit}
                          </Link>
                          {nextStatus ? (
                            <button
                              type="button"
                              disabled={listingBusy}
                              onClick={() =>
                                setListingStatus(listing.id, nextStatus)
                              }
                              className="btn-secondary !min-h-11 flex-1 !px-3 !text-[10px] disabled:opacity-50"
                            >
                              <Check size={12} /> {statusAction}
                            </button>
                          ) : (
                            <span className="pill flex min-h-11 flex-1 items-center justify-center text-center">
                              {AZ_COPY.profile.locked}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={listingBusy}
                            onClick={() => removeListing(listing.id)}
                            className="grid h-11 w-11 place-items-center rounded border border-red-200 bg-red-50 text-red-700 disabled:opacity-50"
                            aria-label={`${AZ_COPY.profile.deleteListing}: ${listing.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={AZ_COPY.profile.emptyListingsTitle}
                  body={AZ_COPY.profile.emptyListingsBody}
                  action={AZ_COPY.profile.listBook}
                  href="/listings/new"
                />
              )}
            </DashboardSection>
          )}

          {tab === "messages" && (
            <DashboardSection
              title={AZ_COPY.profile.messagesTitle}
              icon={MessageCircle}
            >
              <EmptyState
                title={AZ_COPY.profile.messagesEmptyTitle}
                body={AZ_COPY.profile.messagesEmptyBody}
                action={AZ_COPY.profile.openMessages}
                href="/messages"
              />
            </DashboardSection>
          )}

          {tab === "favorites" && (
            <DashboardSection
              title={AZ_COPY.profile.favoritesTitle}
              icon={Heart}
            >
              <EmptyState
                title={AZ_COPY.profile.savedCount(data.favoriteCount)}
                body={AZ_COPY.profile.favoritesBody}
                action={AZ_COPY.profile.openFavorites}
                href="/favorites"
              />
            </DashboardSection>
          )}

          {tab === "requests" && (
            <DashboardSection
              title={AZ_COPY.profile.requestsTitle}
              icon={ShoppingBag}
            >
              <EmptyState
                title={AZ_COPY.profile.requestsEmptyTitle}
                body={AZ_COPY.profile.requestsEmptyBody}
                action={AZ_COPY.profile.openMessages}
                href="/messages"
              />
            </DashboardSection>
          )}

          {tab === "profile" && (
            <DashboardSection
              title={AZ_COPY.profile.profileTitle}
              icon={UserRound}
            >
              <form
                key={user?.id ?? "profile"}
                onSubmit={saveProfile}
                className="catalog-drawer grid max-w-xl gap-4 rounded-sm p-6"
                aria-busy={profileBusy}
              >
                <label>
                  <span className="mb-2 block text-xs font-bold uppercase">
                    {AZ_COPY.profile.name}
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    name="name"
                    autoComplete="name"
                    className="input"
                    defaultValue={data.profile.name}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold uppercase">
                    {AZ_COPY.profile.city}
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    name="city"
                    autoComplete="address-level2"
                    className="input"
                    defaultValue={
                      data.profile.city ? formatCity(data.profile.city) : ""
                    }
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold uppercase">
                    {AZ_COPY.profile.phone}
                  </span>
                  <input
                    type="tel"
                    maxLength={30}
                    name="phone"
                    autoComplete="tel"
                    className="input"
                    defaultValue={data.profile.phone ?? ""}
                  />
                </label>
                <p className="text-xs leading-5 text-gray-500">
                  {AZ_COPY.profile.privacyHelp}
                </p>
                {profileSaved && (
                  <p
                    role="status"
                    className="flex items-center gap-2 text-xs text-emerald-700"
                  >
                    <Check size={12} /> {AZ_COPY.profile.profileSaved}
                  </p>
                )}
                <button
                  disabled={profileBusy}
                  className="btn-primary disabled:opacity-50"
                >
                  {profileBusy
                    ? AZ_COPY.profile.savingProfile
                    : AZ_COPY.profile.saveProfile}
                </button>
              </form>
            </DashboardSection>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="catalog-drawer rounded-sm p-4">
      <span className="text-[10px] font-bold uppercase tracking-[.12em] text-gray-500">
        {label}
      </span>
      <strong className="display mt-2 flex items-center gap-2 text-3xl">
        <BarChart3 size={13} className="text-orange" /> {value}
      </strong>
    </div>
  );
}

function DashboardSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  children: ReactNode;
}) {
  return (
    <section className="mt-9">
      <div className="mb-6 flex items-center gap-3 border-b border-[#cdbd9e] pb-4">
        <Icon size={16} className="text-orange" />
        <h2 className="display text-3xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
