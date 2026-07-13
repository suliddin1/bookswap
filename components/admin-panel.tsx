"use client";

import {
  AlertTriangle,
  BookOpen,
  Check,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { authFetch } from "@/lib/client-api";
import type { Listing } from "@/lib/types";

export function AdminPanel() {
  const [data, setData] = useState<{
    listings: Listing[];
    users: any[];
    reports: any[];
    privacyRequests: any[];
  } | null>(null);
  const [error, setError] = useState("");

  function load() {
    authFetch("/api/admin/dashboard")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setData(body.data);
      })
      .catch((reason) => setError(reason.message));
  }
  useEffect(load, []);

  async function moderate(listingId: string, action: "approve" | "reject") {
    await authFetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action }),
    });
    load();
  }
  async function ban(userId: string, banned: boolean) {
    await authFetch("/api/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned }),
    });
    load();
  }
  async function resolveReport(
    reportId: string,
    status: "resolved" | "dismissed",
  ) {
    await authFetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status }),
    });
    load();
  }
  async function resolvePrivacyRequest(
    requestId: string,
    status: "in_progress" | "completed" | "rejected",
  ) {
    await authFetch("/api/admin/privacy-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    load();
  }

  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title="Admin access required."
          body={error}
          action="Return home"
          href="/"
        />
      </div>
    );
  if (!data)
    return (
      <div className="container-shell min-h-[650px] animate-pulse py-16">
        <div className="h-36 rounded-2xl bg-[#e5dece]" />
        <div className="mt-7 h-96 rounded-2xl bg-[#e5dece]" />
      </div>
    );

  return (
    <div className="container-shell py-12 md:py-16">
      <div className="dark-library rounded-[22px] p-8 md:p-10">
        <span className="eyebrow">Protected administration</span>
        <h1 className="display mt-4 text-5xl font-semibold">Trust & safety.</h1>
        <p className="mt-3 text-xs text-[#c9bdab]">
          Admin-role access for listings, readers, and community reports.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [BookOpen, "Listings", data.listings.length],
          [Users, "Readers", data.users.length],
          [AlertTriangle, "Open reports", data.reports.length],
        ].map(([Icon, label, value]) => {
          const Item = Icon as typeof BookOpen;
          return (
            <div
              key={label as string}
              className="card flex items-center justify-between p-5"
            >
              <div>
                <span className="text-[8px] font-bold uppercase tracking-[.13em] text-gray-400">
                  {label as string}
                </span>
                <strong className="display mt-2 block text-3xl">
                  {String(value)}
                </strong>
              </div>
              <Item size={16} className="text-orange" />
            </div>
          );
        })}
      </div>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">Recent listings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#d8cbb5] text-[8px] uppercase tracking-[.14em] text-gray-400">
                <th className="p-4">Listing</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Location</th>
                <th className="pr-4 text-right">Moderate</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.map((listing) => (
                <tr key={listing.id} className="border-b border-[#e8dfcf]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BookCover listing={listing} className="w-9 !p-1" />
                      <b className="text-[10px]">{listing.title}</b>
                    </div>
                  </td>
                  <td className="text-[10px]">{listing.seller.name}</td>
                  <td>
                    <span className="pill">{listing.status}</span>
                  </td>
                  <td className="text-[10px]">{listing.city}</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label="Approve"
                        onClick={() => moderate(listing.id, "approve")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#eee3c8] text-orange"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        aria-label="Reject"
                        onClick={() => moderate(listing.id, "reject")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-700"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">Reader accounts</h2>
        </div>
        <div className="divide-y divide-[#e8dfcf]">
          {data.users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <b className="block text-[11px]">{user.name}</b>
                <span className="text-[9px] text-gray-500">
                  {user.email} · {user.city || "No location"}
                </span>
              </div>
              <button
                onClick={() => ban(user.id, !user.banned)}
                className={
                  user.banned
                    ? "btn-secondary !min-h-[34px]"
                    : "btn-dark !min-h-[34px]"
                }
              >
                {user.banned ? "Unban" : "Ban"}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">Open reports</h2>
        </div>
        {data.reports.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <b className="block text-[11px]">{report.reason}</b>
                  <span className="text-[9px] text-gray-500">
                    Listing: {report.listing_id || "General report"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveReport(report.id, "resolved")}
                    className="btn-secondary !min-h-[34px]"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => resolveReport(report.id, "dismissed")}
                    className="btn-ghost !min-h-[34px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">No open reports.</p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            Privacy & rights requests
          </h2>
        </div>
        {data.privacyRequests.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.privacyRequests.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <b className="block text-[11px]">
                      {item.type} · {item.status}
                    </b>
                    <p className="mt-2 max-w-2xl text-[10px] leading-5 text-gray-600">
                      {item.details}
                    </p>
                    <span className="mt-1 block text-[8px] text-gray-400">
                      User {item.user_id}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "in_progress")
                      }
                      className="btn-ghost !min-h-[34px]"
                    >
                      Reviewing
                    </button>
                    <button
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "completed")
                      }
                      className="btn-secondary !min-h-[34px]"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => resolvePrivacyRequest(item.id, "rejected")}
                      className="btn-ghost !min-h-[34px]"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">No open privacy requests.</p>
        )}
      </section>
      <div className="mt-8 flex gap-3 rounded-xl border border-[#d8cbb5] bg-[#fffaf0]/60 p-5">
        <ShieldCheck size={17} className="text-orange" />
        <p className="text-[10px] leading-5 text-gray-500">
          Admin endpoints verify the authenticated user’s database role before
          returning or mutating protected data.
        </p>
      </div>
    </div>
  );
}
