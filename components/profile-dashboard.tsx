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
import { useEffect, useRef, useState } from "react";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/client-api";
import { AZ_COPY, formatCity, localizeApiError } from "@/lib/i18n";
import type { Listing } from "@/lib/types";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

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
  const userId = user?.id;
  const [data, setData] = useState<DashboardData | null>(null);
  const [dataOwnerId, setDataOwnerId] = useState<string | null>(null);
  const dashboardData = dataOwnerId === userId ? data : null;
  const [tab, setTab] = useState<TabId>("listings");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [invalidProfileField, setInvalidProfileField] = useState<
    "name" | "city" | null
  >(null);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const loadErrorRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const profileSavedRef = useRef<HTMLParagraphElement>(null);

  function selectTab(id: TabId) {
    setTab(id);
    setProfileSaved(false);
    setInvalidProfileField(null);
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex][0];
    selectTab(nextTab);
    tabRefs.current[nextIndex]?.focus();
  }

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
    if (!dashboardData || profileBusy) return;
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    if (name.length < 2 || city.length < 2) {
      const field = name.length < 2 ? "name" : "city";
      setInvalidProfileField(field);
      setProfileSaved(false);
      setNotice("");
      setError(
        field === "name"
          ? AZ_COPY.profile.nameInvalid
          : AZ_COPY.profile.cityInvalid,
      );
      requestAnimationFrame(() => {
        const control = formElement.elements.namedItem(field);
        if (control instanceof HTMLElement) control.focus();
      });
      return;
    }

    setProfileBusy(true);
    setProfileSaved(false);
    setInvalidProfileField(null);
    setError("");
    setNotice("");
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
      setData({ ...dashboardData, profile: body.data });
      setDataOwnerId(userId ?? null);
      setProfileSaved(true);
    } catch {
      setError(AZ_COPY.profile.profileSaveFailed);
    } finally {
      setProfileBusy(false);
    }
  }

  useEffect(() => {
    if (!userId) {
      setData(null);
      setDataOwnerId(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setData(null);
    setDataOwnerId(null);
    setError("");
    setNotice("");
    setProfileSaved(false);
    setInvalidProfileField(null);
    void authFetch("/api/profile", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            localizeApiError(body.code, AZ_COPY.profile.unavailableBody),
          );
        if (active) {
          setData(body.data);
          setDataOwnerId(userId);
        }
      })
      .catch((reason) => {
        if (active && reason?.name !== "AbortError")
          setError(AZ_COPY.profile.unavailableBody);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [userId]);

  useEffect(() => {
    if (!error) return;
    if (!dashboardData) loadErrorRef.current?.focus();
    else if (!invalidProfileField) feedbackRef.current?.focus();
  }, [dashboardData, error, invalidProfileField]);

  useEffect(() => {
    if (notice) feedbackRef.current?.focus();
  }, [notice]);

  useEffect(() => {
    if (profileSaved) profileSavedRef.current?.focus();
  }, [profileSaved]);

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

  if (error && !dashboardData)
    return (
      <div
        ref={loadErrorRef}
        className="container-shell py-16"
        role="alert"
        tabIndex={-1}
      >
        <EmptyState
          title={AZ_COPY.profile.unavailableTitle}
          body={AZ_COPY.profile.unavailableBody}
          action={AZ_COPY.profile.signInAgain}
          href="/login"
          headingLevel="h1"
        />
      </div>
    );

  if (!dashboardData)
    return (
      <div
        className="container-shell min-h-[650px] animate-pulse py-16"
        role="status"
        aria-live="polite"
        aria-busy="true"
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

  const name =
    dashboardData.profile.name || user?.email || AZ_COPY.profile.reader;
  const firstName = name.trim().split(/\s+/)[0] || AZ_COPY.profile.reader;
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const active = dashboardData.listings.filter(
    (item) => item.status === "active",
  ).length;
  const sold = dashboardData.listings.filter(
    (item) => item.status === "sold",
  ).length;

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 border-b-2 border-[#5b3c25] pb-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <span className="bookmark-badge">{AZ_COPY.profile.badge}</span>
          <h1 className="display mt-4 min-w-0 break-words text-4xl font-semibold leading-tight [overflow-wrap:anywhere] sm:text-5xl">
            {AZ_COPY.profile.welcome(firstName)}
          </h1>
        </div>
        <Link href="/listings/new" className="btn-primary shrink-0">
          <Plus size={14} /> {AZ_COPY.profile.createListing}
        </Link>
      </div>

      <div className="grid gap-7 lg:grid-cols-[210px_1fr]">
        <aside className="catalog-drawer h-fit rounded-sm p-4">
          <div className="flex min-w-0 items-center gap-3 border-b border-[#cfbea0] pb-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-bold text-orange">
              {initials}
            </span>
            <div className="min-w-0">
              <b className="block break-words text-xs">{name}</b>
              <span className="block break-words text-xs text-[#6b6254]">
                {dashboardData.profile.city
                  ? formatCity(dashboardData.profile.city)
                  : AZ_COPY.profile.locationNotSet}
              </span>
            </div>
          </div>
          <nav className="mt-3" aria-label={AZ_COPY.profile.navigationLabel}>
            <div
              className="divide-y divide-[#95866f]"
              role="tablist"
              aria-label={AZ_COPY.profile.navigationLabel}
              aria-orientation="vertical"
            >
              {tabs.map(([id, label, Icon], index) => (
                <button
                  key={id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`profile-tab-${id}`}
                  type="button"
                  role="tab"
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  aria-controls="profile-tabpanel"
                  aria-selected={tab === id}
                  tabIndex={tab === id ? 0 : -1}
                  className={`flex min-h-11 w-full items-center gap-3 py-3 text-left text-xs font-bold transition ${tab === id ? "text-orange" : "text-gray-600 hover:pl-1"}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <div id="profile-dashboard-content" className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={AZ_COPY.profile.activeListings} value={active} />
            <Stat label={AZ_COPY.profile.soldBooks} value={sold} />
            <Stat
              label={AZ_COPY.profile.savedBooks}
              value={dashboardData.favoriteCount}
            />
            <Stat
              label={AZ_COPY.profile.totalListings}
              value={dashboardData.listings.length}
            />
          </div>

          {error && (
            <p
              ref={feedbackRef}
              id="profile-dashboard-feedback"
              role="alert"
              tabIndex={-1}
              className="mt-5 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              ref={feedbackRef}
              id="profile-dashboard-feedback"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              tabIndex={-1}
              className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"
            >
              {notice}
            </p>
          )}

          <div
            id="profile-tabpanel"
            role="tabpanel"
            aria-labelledby={`profile-tab-${tab}`}
            tabIndex={0}
            className="min-w-0"
          >
            {tab === "listings" && (
              <DashboardSection
                id="profile-section-listings"
                title={AZ_COPY.profile.listingsTitle}
                icon={BookOpen}
              >
                {dashboardData.listings.length ? (
                  <div className="shelf-row grid min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {dashboardData.listings.map((listing) => {
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
                        <div
                          key={listing.id}
                          aria-busy={listingBusy}
                          aria-describedby={
                            listingBusy
                              ? `listing-busy-${listing.id}`
                              : undefined
                          }
                        >
                          {listingBusy && (
                            <p
                              id={`listing-busy-${listing.id}`}
                              role="status"
                              className="sr-only"
                            >
                              {AZ_COPY.profile.listingUpdating(listing.title)}
                            </p>
                          )}
                          <BookCard listing={listing} />
                          <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                            <Link
                              href={`/listings/${listing.id}/edit`}
                              className="btn-secondary !min-h-11 min-w-0 flex-[1_1_9rem] !border-[#95866f] !px-3 !text-xs"
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
                                className="btn-secondary !min-h-11 min-w-0 flex-[1_1_9rem] !border-[#95866f] !px-3 !text-xs disabled:opacity-50"
                              >
                                <Check size={12} /> {statusAction}
                              </button>
                            ) : (
                              <span className="pill flex min-h-11 min-w-0 flex-[1_1_9rem] items-center justify-center whitespace-normal text-center !text-xs">
                                {AZ_COPY.profile.locked}
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={listingBusy}
                              onClick={() => removeListing(listing.id)}
                              className="grid h-11 w-11 shrink-0 place-items-center rounded border border-red-700 bg-red-50 text-red-700 disabled:opacity-50"
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
                id="profile-section-messages"
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
                id="profile-section-favorites"
                title={AZ_COPY.profile.favoritesTitle}
                icon={Heart}
              >
                <EmptyState
                  title={AZ_COPY.profile.savedCount(
                    dashboardData.favoriteCount,
                  )}
                  body={AZ_COPY.profile.favoritesBody}
                  action={AZ_COPY.profile.openFavorites}
                  href="/favorites"
                />
              </DashboardSection>
            )}

            {tab === "requests" && (
              <DashboardSection
                id="profile-section-requests"
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
                id="profile-section-profile"
                title={AZ_COPY.profile.profileTitle}
                icon={UserRound}
              >
                <form
                  key={`${user?.id ?? "profile"}:${dashboardData.profile.name}:${dashboardData.profile.city ?? ""}:${dashboardData.profile.phone ?? ""}`}
                  onSubmit={saveProfile}
                  noValidate
                  className="catalog-drawer grid min-w-0 max-w-xl gap-4 rounded-sm p-4 sm:p-6"
                  aria-busy={profileBusy}
                  aria-describedby={
                    error ? "profile-dashboard-feedback" : undefined
                  }
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
                      defaultValue={dashboardData.profile.name}
                      aria-invalid={invalidProfileField === "name"}
                      aria-describedby={
                        invalidProfileField === "name"
                          ? "profile-dashboard-feedback"
                          : undefined
                      }
                      onChange={() => {
                        setProfileSaved(false);
                        if (invalidProfileField === "name") {
                          setInvalidProfileField(null);
                          setError("");
                        }
                      }}
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
                        dashboardData.profile.city
                          ? formatCity(dashboardData.profile.city)
                          : ""
                      }
                      aria-invalid={invalidProfileField === "city"}
                      aria-describedby={
                        invalidProfileField === "city"
                          ? "profile-dashboard-feedback"
                          : undefined
                      }
                      onChange={() => {
                        setProfileSaved(false);
                        if (invalidProfileField === "city") {
                          setInvalidProfileField(null);
                          setError("");
                        }
                      }}
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
                      defaultValue={dashboardData.profile.phone ?? ""}
                      aria-describedby="profile-privacy-help"
                      onChange={() => setProfileSaved(false)}
                    />
                  </label>
                  <p
                    id="profile-privacy-help"
                    className="break-words text-xs leading-5 text-[#6b6254]"
                  >
                    {AZ_COPY.profile.privacyHelp}
                  </p>
                  {profileSaved && (
                    <p
                      ref={profileSavedRef}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      tabIndex={-1}
                      className="flex items-center gap-2 text-xs leading-5 text-emerald-700"
                    >
                      <Check size={12} /> {AZ_COPY.profile.profileSaved}
                    </p>
                  )}
                  <button
                    type="submit"
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="catalog-drawer rounded-sm p-4">
      <span className="break-words text-xs font-bold uppercase tracking-[.12em] text-[#6b6254]">
        {label}
      </span>
      <strong className="display mt-2 flex items-center gap-2 text-3xl">
        <BarChart3 size={13} className="text-orange" /> {value}
      </strong>
    </div>
  );
}

function DashboardSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof BookOpen;
  children: ReactNode;
}) {
  return (
    <section className="mt-9 min-w-0" aria-labelledby={id}>
      <div className="mb-6 flex items-center gap-3 border-b border-[#cdbd9e] pb-4">
        <Icon size={16} className="text-orange" />
        <h2 id={id} className="display break-words text-3xl font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
