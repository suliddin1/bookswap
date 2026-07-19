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
import {
  parseAdminDashboardResponse,
  type AdminDashboardData,
} from "@/lib/admin-dashboard";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAdminAuditAction,
  formatAdminAuditState,
  formatAdminAuditTarget,
  formatAzDateTime,
  formatAzNumber,
  formatCity,
  formatListingStatus,
  formatModerationCategory,
  formatModerationContentType,
  formatModerationOutcome,
  formatModerationProvider,
  formatModerationReason,
  formatModerationSurface,
  formatPrivacyRequestStatus,
  formatPrivacyRequestType,
  localizeApiError,
} from "@/lib/i18n";

class LocalizedAdminActionError extends Error {}

export function AdminPanel() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  function load() {
    authFetch("/api/admin/dashboard")
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          const code =
            body && typeof body === "object" && !Array.isArray(body)
              ? (body as Record<string, unknown>).code
              : undefined;
          throw new Error(localizeApiError(code, AZ_COPY.admin.loadFailed));
        }
        setError("");
        setData(parseAdminDashboardResponse(body));
      })
      .catch(() => setError(AZ_COPY.admin.loadFailed));
  }
  useEffect(load, []);

  async function runAdminAction(
    url: string,
    method: "POST" | "PATCH",
    payload: Record<string, unknown>,
  ) {
    const reason = actionReason.trim();
    if (reason.length < 10) {
      setActionError(AZ_COPY.admin.reasonTooShort);
      return;
    }
    setActionBusy(true);
    setActionError("");
    setActionStatus("");
    try {
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, reason }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const code =
          body && typeof body === "object" && !Array.isArray(body)
            ? (body as Record<string, unknown>).code
            : undefined;
        throw new LocalizedAdminActionError(
          localizeApiError(code, AZ_COPY.admin.actionFailed),
        );
      }
      setActionReason("");
      setActionStatus(AZ_COPY.admin.actionRecorded);
      load();
    } catch (reason) {
      setActionError(
        reason instanceof LocalizedAdminActionError
          ? reason.message
          : AZ_COPY.admin.actionFailed,
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function moderate(listingId: string, action: "approve" | "reject") {
    await runAdminAction("/api/admin/moderate", "POST", {
      listingId,
      action,
    });
  }
  async function ban(userId: string, banned: boolean) {
    await runAdminAction("/api/admin/ban", "POST", { userId, banned });
  }
  async function resolveReport(
    reportId: string,
    status: "resolved" | "dismissed",
  ) {
    await runAdminAction("/api/admin/reports", "PATCH", {
      reportId,
      status,
    });
  }
  async function resolvePrivacyRequest(
    requestId: string,
    status: "in_progress" | "completed" | "rejected",
  ) {
    await runAdminAction("/api/admin/privacy-requests", "PATCH", {
      requestId,
      status,
    });
  }

  const actionReady =
    actionReason.trim().length >= 10 && actionReason.trim().length <= 1000;

  if (error)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.admin.authTitle}
          body={error}
          action={AZ_COPY.admin.returnHome}
          href="/"
          headingLevel="h1"
        />
      </div>
    );
  if (!data)
    return (
      <div
        className="container-shell min-h-[650px] animate-pulse py-16"
        role="status"
        aria-label={AZ_COPY.admin.loading}
      >
        <h1 className="sr-only">{AZ_COPY.admin.loading}</h1>
        <div className="h-36 rounded-2xl bg-[#e5dece]" />
        <div className="mt-7 h-96 rounded-2xl bg-[#e5dece]" />
      </div>
    );

  return (
    <div className="container-shell py-12 md:py-16">
      <div className="dark-library rounded-[22px] p-8 md:p-10">
        <span className="eyebrow">{AZ_COPY.admin.eyebrow}</span>
        <h1 className="display mt-4 text-5xl font-semibold">
          {AZ_COPY.admin.title}
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-5 text-[#c9bdab]">
          {AZ_COPY.admin.intro}
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [BookOpen, AZ_COPY.admin.listingsStat, data.listings.length],
          [Users, AZ_COPY.admin.readersStat, data.users.length],
          [AlertTriangle, AZ_COPY.admin.reportsStat, data.reports.length],
          [
            ShieldCheck,
            AZ_COPY.admin.moderationStat,
            data.moderationDecisions.length,
          ],
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
                  {formatAzNumber(Number(value))}
                </strong>
              </div>
              <Item size={16} className="text-orange" />
            </div>
          );
        })}
      </div>
      <section className="card mt-8 p-5" aria-busy={actionBusy}>
        <label htmlFor="admin-action-reason" className="block">
          <span className="text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
            {AZ_COPY.admin.reasonLabel}
          </span>
          <textarea
            id="admin-action-reason"
            className="input mt-3 min-h-24 py-3"
            value={actionReason}
            minLength={10}
            maxLength={1000}
            disabled={actionBusy}
            aria-describedby="admin-action-reason-help"
            onChange={(event) => {
              setActionReason(event.target.value);
              setActionError("");
              setActionStatus("");
            }}
            placeholder={AZ_COPY.admin.reasonPlaceholder}
          />
        </label>
        <div
          id="admin-action-reason-help"
          className="mt-2 flex flex-wrap justify-between gap-2 text-[9px] text-gray-500"
        >
          <span>{AZ_COPY.admin.reasonHelp}</span>
          <span>{actionReason.length}/1000</span>
        </div>
        {actionError && (
          <p role="alert" className="mt-3 text-[10px] text-red-700">
            {actionError}
          </p>
        )}
        {actionBusy && (
          <p role="status" className="mt-3 text-[10px] text-gray-500">
            {AZ_COPY.admin.actionRecording}
          </p>
        )}
        {actionStatus && !actionBusy && (
          <p role="status" className="mt-3 text-[10px] text-green-800">
            {actionStatus}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.historyTitle}
          </h2>
          <p className="mt-2 text-[10px] leading-5 text-gray-500">
            {AZ_COPY.admin.historyBody}
          </p>
        </div>
        {data.auditLog.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.auditLog.map((entry) => (
              <div
                key={entry.id}
                className="grid gap-3 p-4 text-[10px] sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">
                      {formatAdminAuditTarget(entry.target_type)}
                    </span>
                    <b>{formatAdminAuditAction(entry.action)}</b>
                  </div>
                  <p className="mt-2 break-words leading-5 text-gray-600">
                    {entry.reason}
                  </p>
                  <code className="mt-2 block break-all text-[8px] text-gray-500">
                    {AZ_COPY.admin.stateChange}:{" "}
                    {formatAdminAuditState(
                      entry.target_type,
                      entry.before_state,
                    )}
                    {" → "}
                    {formatAdminAuditState(
                      entry.target_type,
                      entry.after_state,
                    )}
                  </code>
                  <span className="mt-2 block text-[8px] text-gray-400">
                    {AZ_COPY.admin.actor}: {entry.actor_name} · {entry.actor_id}{" "}
                    · {AZ_COPY.admin.target}: {entry.target_id}
                  </span>
                </div>
                <time
                  dateTime={entry.created_at}
                  className="text-[9px] text-gray-400"
                >
                  {formatAzDateTime(entry.created_at)}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.historyEmpty}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.recentListings}
          </h2>
        </div>
        {data.listings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#d8cbb5] text-[8px] uppercase tracking-[.14em] text-gray-400">
                  <th scope="col" className="p-4">
                    {AZ_COPY.admin.listing}
                  </th>
                  <th scope="col">{AZ_COPY.admin.seller}</th>
                  <th scope="col">{AZ_COPY.admin.status}</th>
                  <th scope="col">{AZ_COPY.admin.location}</th>
                  <th scope="col" className="pr-4 text-right">
                    {AZ_COPY.admin.moderate}
                  </th>
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
                      <span className="pill">
                        {formatListingStatus(listing.status)}
                      </span>
                    </td>
                    <td className="text-[10px]">{formatCity(listing.city)}</td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`${AZ_COPY.admin.approve}: ${listing.title}`}
                          disabled={!actionReady || actionBusy}
                          onClick={() => moderate(listing.id, "approve")}
                          className="grid h-8 w-8 place-items-center rounded-full bg-[#eee3c8] text-orange disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          aria-label={`${AZ_COPY.admin.reject}: ${listing.title}`}
                          disabled={!actionReady || actionBusy}
                          onClick={() => moderate(listing.id, "reject")}
                          className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
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
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.listingsEmpty}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.readerAccounts}
          </h2>
        </div>
        {data.users.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <b className="block text-[11px]">{user.name}</b>
                  <span className="block break-all text-[9px] text-gray-500">
                    {user.email} ·{" "}
                    {user.city
                      ? formatCity(user.city)
                      : AZ_COPY.admin.noLocation}
                  </span>
                </div>
                <button
                  disabled={!actionReady || actionBusy}
                  onClick={() => ban(user.id, !user.banned)}
                  className={`shrink-0 ${
                    user.banned
                      ? "btn-secondary !min-h-[34px]"
                      : "btn-dark !min-h-[34px]"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {user.banned ? AZ_COPY.admin.unban : AZ_COPY.admin.ban}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.readersEmpty}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.openReports}
          </h2>
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
                    {AZ_COPY.admin.reportListing}:{" "}
                    {report.listing_id || AZ_COPY.admin.generalReport}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!actionReady || actionBusy}
                    onClick={() => resolveReport(report.id, "resolved")}
                    className="btn-secondary !min-h-[34px] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {AZ_COPY.admin.resolve}
                  </button>
                  <button
                    disabled={!actionReady || actionBusy}
                    onClick={() => resolveReport(report.id, "dismissed")}
                    className="btn-ghost !min-h-[34px] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {AZ_COPY.admin.dismiss}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.reportsEmpty}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.privacyRequests}
          </h2>
        </div>
        {data.privacyRequests.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.privacyRequests.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <b className="block text-[11px]">
                      {formatPrivacyRequestType(item.type)} ·{" "}
                      {formatPrivacyRequestStatus(item.status)}
                    </b>
                    <p className="mt-2 max-w-2xl text-[10px] leading-5 text-gray-600">
                      {item.details}
                    </p>
                    <span className="mt-1 block text-[8px] text-gray-400">
                      {AZ_COPY.admin.user}: {item.user_id}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      disabled={!actionReady || actionBusy}
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "in_progress")
                      }
                      className="btn-ghost !min-h-[34px] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {AZ_COPY.admin.reviewing}
                    </button>
                    <button
                      disabled={!actionReady || actionBusy}
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "completed")
                      }
                      className="btn-secondary !min-h-[34px] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {AZ_COPY.admin.complete}
                    </button>
                    <button
                      disabled={!actionReady || actionBusy}
                      onClick={() => resolvePrivacyRequest(item.id, "rejected")}
                      className="btn-ghost !min-h-[34px] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {AZ_COPY.admin.privacyReject}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.privacyEmpty}
          </p>
        )}
      </section>
      <section className="card mt-8 overflow-hidden">
        <div className="border-b border-[#d8cbb5] p-5">
          <h2 className="display text-2xl font-semibold">
            {AZ_COPY.admin.automatedModeration}
          </h2>
          <p className="mt-2 text-[10px] leading-5 text-gray-500">
            {AZ_COPY.admin.automatedModerationBody}
          </p>
        </div>
        {data.moderationDecisions.length ? (
          <div className="divide-y divide-[#e8dfcf]">
            {data.moderationDecisions.map((decision) => (
              <div
                key={decision.id}
                className="grid gap-3 p-4 text-[10px] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">
                      {formatModerationOutcome(decision.outcome)}
                    </span>
                    <b>{formatModerationSurface(decision.surface)}</b>
                    <span className="text-gray-500">
                      {formatModerationContentType(decision.content_type)} ·{" "}
                      {formatModerationProvider(decision.provider)}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-gray-500">
                    {formatModerationReason(decision.reason_code)} (
                    {decision.reason_code})
                    {decision.categories.length
                      ? ` · ${decision.categories
                          .map(
                            (category) =>
                              `${formatModerationCategory(category)} (${category})`,
                          )
                          .join(", ")}`
                      : ""}
                  </p>
                  <span className="mt-1 block text-[8px] text-gray-400">
                    {AZ_COPY.admin.actor}:{" "}
                    {decision.actor?.name ?? AZ_COPY.admin.deletedAccount}
                    {decision.target_id
                      ? ` · ${AZ_COPY.admin.target}: ${decision.target_id}`
                      : ""}
                  </span>
                </div>
                <time
                  dateTime={decision.created_at}
                  className="text-[9px] text-gray-400"
                >
                  {formatAzDateTime(decision.created_at)}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-gray-500">
            {AZ_COPY.admin.moderationEmpty}
          </p>
        )}
      </section>
      <div className="mt-8 flex gap-3 rounded-xl border border-[#d8cbb5] bg-[#fffaf0]/60 p-5">
        <ShieldCheck size={17} className="text-orange" />
        <p className="text-[10px] leading-5 text-gray-500">
          {AZ_COPY.admin.securityNote}
        </p>
      </div>
    </div>
  );
}
