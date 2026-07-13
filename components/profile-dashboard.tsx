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
import { authFetch } from "@/lib/client-api";
import { Listing } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

const tabs = [
  ["listings", "My Listings", BookOpen],
  ["messages", "Messages", MessageCircle],
  ["favorites", "Favorites", Heart],
  ["requests", "Sales / Requests", ShoppingBag],
  ["profile", "Profile", UserRound],
] as const;

export function ProfileDashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<{
    profile: any;
    listings: Listing[];
    favoriteCount: number;
  } | null>(null);
  const [tab, setTab] = useState("listings");
  const [error, setError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  async function removeListing(id: string) {
    if (!window.confirm("Delete this listing permanently?")) return;
    const response = await authFetch(`/api/listings/${id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setData((current) =>
        current
          ? {
              ...current,
              listings: current.listings.filter((item) => item.id !== id),
            }
          : current,
      );
  }

  async function setListingStatus(id: string, status: "active" | "sold") {
    const response = await authFetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
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
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setProfileSaved(false);
    setError("");
    const form = new FormData(event.currentTarget);
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
    if (!response.ok) return setError(body.error);
    setData({ ...data, profile: body.data });
    setProfileSaved(true);
  }

  useEffect(() => {
    if (!user) return;
    authFetch("/api/profile")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setData(body.data);
      })
      .catch((reason) => setError(reason.message));
  }, [user]);

  if (!loading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Your marketplace dashboard awaits."
          body="Sign in to manage listings, favorites, and conversations."
          action="Sign in"
          href="/login"
        />
      </div>
    );
  if (error && !data)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Dashboard unavailable."
          body={error}
          action="Try signing in again"
          href="/login"
        />
      </div>
    );
  if (!data)
    return (
      <div className="container-shell min-h-[650px] animate-pulse py-16">
        <div className="h-32 rounded bg-[#e5dece]" />
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((x) => (
            <div key={x} className="h-28 rounded bg-[#e5dece]" />
          ))}
        </div>
      </div>
    );
  const name = data.profile.name ?? user?.email ?? "Reader";
  const initials = name
    .split(" ")
    .map((part: string) => part[0])
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
          <span className="bookmark-badge">Seller dashboard</span>
          <h1 className="display mt-4 text-5xl font-semibold">
            Welcome back, {name.split(" ")[0]}.
          </h1>
        </div>
        <Link href="/listings/new" className="btn-primary">
          <Plus size={14} /> Create listing
        </Link>
      </div>

      <div className="grid gap-7 lg:grid-cols-[210px_1fr]">
        <aside className="catalog-drawer h-fit rounded-sm p-4">
          <div className="flex items-center gap-3 border-b border-[#cfbea0] pb-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-xs font-bold text-orange">
              {initials}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[11px]">{name}</b>
              <span className="block truncate text-[8px] text-gray-500">
                {data.profile.city || "Location not set"}
              </span>
            </div>
          </div>
          <nav className="mt-3 divide-y divide-[#d8c8a9]">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 py-3 text-left text-[10px] font-bold transition ${tab === id ? "text-orange" : "text-gray-600 hover:pl-1"}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <section className="grid gap-3 sm:grid-cols-4">
            <Stat label="Active listings" value={active} />
            <Stat label="Sold books" value={sold} />
            <Stat label="Saved by readers" value={data.favoriteCount} />
            <Stat label="Listing views" value="—" />
          </section>

          {tab === "listings" && (
            <DashboardSection title="My Listings" icon={BookOpen}>
              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 p-3 text-[10px] text-red-700"
                >
                  {error}
                </p>
              )}
              {data.listings.length ? (
                <div className="shelf-row grid grid-cols-2 gap-8 md:grid-cols-3">
                  {data.listings.map((listing) => (
                    <div key={listing.id}>
                      <BookCard listing={listing} />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="btn-secondary !min-h-[34px] flex-1 !px-3 !text-[9px]"
                        >
                          <Edit3 size={11} /> Edit
                        </Link>
                        <button
                          onClick={() =>
                            setListingStatus(
                              listing.id,
                              listing.status === "sold" ? "active" : "sold",
                            )
                          }
                          className="btn-secondary !min-h-[34px] flex-1 !px-3 !text-[9px]"
                        >
                          <Check size={11} />{" "}
                          {listing.status === "sold" ? "Relist" : "Mark sold"}
                        </button>
                        <button
                          onClick={() => removeListing(listing.id)}
                          className="grid h-[34px] w-[34px] place-items-center rounded border border-red-200 bg-red-50 text-red-700"
                          aria-label="Delete listing"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No listings yet."
                  body="List a finished book and help it find another reader."
                  action="List a book"
                  href="/listings/new"
                />
              )}
            </DashboardSection>
          )}
          {tab === "messages" && (
            <DashboardSection title="Messages" icon={MessageCircle}>
              <EmptyState
                title="Continue your conversations."
                body="Open the messages marketplace inbox to speak with buyers and sellers."
                action="Open messages"
                href="/messages"
              />
            </DashboardSection>
          )}
          {tab === "favorites" && (
            <DashboardSection title="Favorites" icon={Heart}>
              <EmptyState
                title={`${data.favoriteCount} saved book${data.favoriteCount === 1 ? "" : "s"}.`}
                body="Your saved marketplace finds live in one place."
                action="Open favorites"
                href="/favorites"
              />
            </DashboardSection>
          )}
          {tab === "requests" && (
            <DashboardSection title="Sales / Requests" icon={ShoppingBag}>
              <EmptyState
                title="Buyer conversations are your active requests."
                body="Open messages to discuss an exchange, then mark the listing sold when it is complete."
                action="Open messages"
                href="/messages"
              />
            </DashboardSection>
          )}
          {tab === "profile" && (
            <DashboardSection title="Profile" icon={UserRound}>
              <form
                onSubmit={saveProfile}
                className="catalog-drawer grid max-w-xl gap-4 rounded-sm p-6"
              >
                <label>
                  <span className="mb-2 block text-[9px] font-bold uppercase">
                    Name
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    name="name"
                    className="input"
                    defaultValue={data.profile.name ?? ""}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-[9px] font-bold uppercase">
                    City
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    name="city"
                    className="input"
                    defaultValue={data.profile.city ?? ""}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-[9px] font-bold uppercase">
                    Phone (kept private)
                  </span>
                  <input
                    maxLength={30}
                    name="phone"
                    className="input"
                    defaultValue={data.profile.phone ?? ""}
                  />
                </label>
                <p className="text-[9px] leading-5 text-gray-500">
                  Your email and phone are never included in public seller
                  profiles. Share contact details only when you are comfortable.
                </p>
                {error && <p className="text-[10px] text-red-700">{error}</p>}
                {profileSaved && (
                  <p className="flex items-center gap-2 text-[10px] text-emerald-700">
                    <Check size={12} /> Profile saved
                  </p>
                )}
                <button className="btn-primary">Save profile</button>
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
      <span className="text-[8px] font-bold uppercase tracking-[.12em] text-gray-500">
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
  children: React.ReactNode;
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
