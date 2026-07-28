"use client";

import {
  AlertTriangle,
  BookOpen,
  Check,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
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

type AdminFeedback = {
  ownerId: string;
  message: string;
  type: "error" | "status";
  focus: "reason" | "feedback";
};

export function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [ownedData, setOwnedData] = useState<{
    ownerId: string;
    data: AdminDashboardData;
  } | null>(null);
  const data =
    ownedData && ownedData.ownerId === userId ? ownedData.data : null;
  const [loadFailedForUserId, setLoadFailedForUserId] = useState<string | null>(
    null,
  );
  const loadFailed = Boolean(userId && loadFailedForUserId === userId);
  const [reasonDraft, setReasonDraft] = useState<{
    ownerId: string;
    value: string;
  } | null>(null);
  const actionReason =
    reasonDraft && reasonDraft.ownerId === userId ? reasonDraft.value : "";
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const visibleFeedback = feedback?.ownerId === userId ? feedback : null;
  const [actionBusyForUserId, setActionBusyForUserId] = useState<string | null>(
    null,
  );
  const actionBusy = Boolean(userId && actionBusyForUserId === userId);
  const activeUserIdRef = useRef(userId);
  activeUserIdRef.current = userId;
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const loadErrorRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    const response = await authFetch("/api/admin/dashboard", { signal });
    const body: unknown = await response.json();
    if (!response.ok) {
      const code =
        body && typeof body === "object" && !Array.isArray(body)
          ? (body as Record<string, unknown>).code
          : undefined;
      throw new Error(localizeApiError(code, AZ_COPY.admin.loadFailed));
    }
    return parseAdminDashboardResponse(body);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setOwnedData(null);
      setLoadFailedForUserId(null);
      setReasonDraft(null);
      setFeedback(null);
      setActionBusyForUserId(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const requestUserId = userId;
    setOwnedData(null);
    setLoadFailedForUserId(null);
    setReasonDraft(null);
    setFeedback(null);
    setActionBusyForUserId(null);
    loadDashboard(controller.signal)
      .then((nextData) => {
        if (active) setOwnedData({ ownerId: requestUserId, data: nextData });
      })
      .catch((reason: unknown) => {
        if (
          active &&
          !(reason instanceof DOMException && reason.name === "AbortError")
        )
          setLoadFailedForUserId(requestUserId);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, loadDashboard, userId]);

  useEffect(() => {
    if (loadFailed) loadErrorRef.current?.focus();
  }, [loadFailed]);

  useEffect(() => {
    if (!visibleFeedback || actionBusy) return;
    window.requestAnimationFrame(() => {
      if (visibleFeedback.focus === "reason") reasonRef.current?.focus();
      else feedbackRef.current?.focus();
    });
  }, [actionBusy, visibleFeedback]);

  async function runAdminAction(
    url: string,
    method: "POST" | "PATCH",
    payload: Record<string, unknown>,
  ) {
    if (!userId || actionBusy) return;
    const requestUserId = userId;
    const reason = actionReason.trim();
    if (reason.length < 10) {
      setFeedback({
        ownerId: requestUserId,
        message: AZ_COPY.admin.reasonTooShort,
        type: "error",
        focus: "reason",
      });
      return;
    }
    setActionBusyForUserId(requestUserId);
    setFeedback(null);
    try {
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, reason }),
      });
      const body: unknown = await response.json();
      if (activeUserIdRef.current !== requestUserId) return;
      if (!response.ok) {
        const code =
          body && typeof body === "object" && !Array.isArray(body)
            ? (body as Record<string, unknown>).code
            : undefined;
        throw new LocalizedAdminActionError(
          localizeApiError(code, AZ_COPY.admin.actionFailed),
        );
      }
      setReasonDraft((current) =>
        current?.ownerId === requestUserId ? null : current,
      );
      let message: string = AZ_COPY.admin.actionRecorded;
      try {
        const nextData = await loadDashboard();
        if (activeUserIdRef.current !== requestUserId) return;
        setOwnedData({ ownerId: requestUserId, data: nextData });
      } catch {
        if (activeUserIdRef.current !== requestUserId) return;
        message = AZ_COPY.admin.actionRecordedRefreshFailed;
      }
      setFeedback({
        ownerId: requestUserId,
        message,
        type: "status",
        focus: "feedback",
      });
    } catch (reason) {
      if (activeUserIdRef.current !== requestUserId) return;
      setFeedback({
        ownerId: requestUserId,
        message:
          reason instanceof LocalizedAdminActionError
            ? reason.message
            : AZ_COPY.admin.actionFailed,
        type: "error",
        focus: "feedback",
      });
    } finally {
      setActionBusyForUserId((current) =>
        current === requestUserId ? null : current,
      );
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

  if (!authLoading && !user)
    return (
      <div className="container-shell py-16">
        <EmptyState
          title={AZ_COPY.admin.authTitle}
          body={AZ_COPY.admin.authBody}
          action={AZ_COPY.admin.returnHome}
          href="/"
          headingLevel="h1"
        />
      </div>
    );
  if (loadFailed)
    return (
      <div
        ref={loadErrorRef}
        className="container-shell py-16 focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
        role="alert"
        tabIndex={-1}
      >
        <EmptyState
          title={AZ_COPY.admin.authTitle}
          body={AZ_COPY.admin.loadFailed}
          action={AZ_COPY.admin.returnHome}
          href="/"
          headingLevel="h1"
        />
      </div>
    );
  if (authLoading || !data)
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
      <div className="dark-library min-w-0 rounded-[22px] p-5 sm:p-8 md:p-10">
        <span className="eyebrow text-[#f0c66b]">{AZ_COPY.admin.eyebrow}</span>
        <h1 className="display mt-4 break-words text-4xl font-semibold [overflow-wrap:anywhere] sm:text-5xl">
          {AZ_COPY.admin.title}
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-5 text-[#c9bdab]">
          {AZ_COPY.admin.intro}
        </p>
      </div>

      <nav
        aria-label={AZ_COPY.admin.navigationLabel}
        className="card mt-6 p-3 sm:p-4"
      >
        <ul className="flex min-w-0 flex-wrap gap-2">
          {[
            ["admin-overview-title", AZ_COPY.admin.overviewTitle],
            ["admin-action-title", AZ_COPY.admin.actionSectionTitle],
            ["admin-history-title", AZ_COPY.admin.historyTitle],
            ["admin-listings-title", AZ_COPY.admin.recentListings],
            ["admin-readers-title", AZ_COPY.admin.readerAccounts],
            ["admin-reports-title", AZ_COPY.admin.openReports],
            ["admin-privacy-title", AZ_COPY.admin.privacyRequests],
            ["admin-moderation-title", AZ_COPY.admin.contentRuleDecisions],
          ].map(([id, label]) => (
            <li key={id} className="min-w-0">
              <a
                href={`#${id}`}
                onClick={() => {
                  window.requestAnimationFrame(() =>
                    document.getElementById(id)?.focus(),
                  );
                }}
                className="inline-flex min-h-11 max-w-full items-center rounded-lg px-3 py-2 text-xs font-bold text-[#6b6254] hover:bg-[#f2eadb] hover:text-[#8f6213]"
              >
                <span className="break-words [overflow-wrap:anywhere]">
                  {label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mt-8" aria-labelledby="admin-overview-title">
        <h2
          id="admin-overview-title"
          tabIndex={-1}
          className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
        >
          {AZ_COPY.admin.overviewTitle}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <li
                key={label as string}
                className="card flex min-w-0 items-center justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <span className="block break-words text-xs font-bold uppercase tracking-[.13em] text-[#6b6254] [overflow-wrap:anywhere]">
                    {label as string}
                  </span>
                  <strong className="display mt-2 block text-3xl">
                    {formatAzNumber(Number(value))}
                  </strong>
                </div>
                <Item
                  aria-hidden="true"
                  size={18}
                  className="shrink-0 text-[#8f6213]"
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="card mt-8 min-w-0 p-4 sm:p-5"
        aria-labelledby="admin-action-title"
        aria-busy={actionBusy}
      >
        <h2
          id="admin-action-title"
          tabIndex={-1}
          className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
        >
          {AZ_COPY.admin.actionSectionTitle}
        </h2>
        <label
          htmlFor="admin-action-reason"
          className="mt-4 block text-xs font-bold uppercase tracking-[.13em] text-[#6b6254]"
        >
          {AZ_COPY.admin.reasonLabel}
        </label>
        <textarea
          ref={reasonRef}
          id="admin-action-reason"
          className="input mt-3 min-h-24 min-w-0 py-3"
          value={actionReason}
          minLength={10}
          maxLength={1000}
          disabled={actionBusy}
          aria-invalid={visibleFeedback?.focus === "reason"}
          aria-describedby={
            visibleFeedback?.focus === "reason"
              ? "admin-action-reason-help admin-action-feedback"
              : "admin-action-reason-help"
          }
          onChange={(event) => {
            if (userId)
              setReasonDraft({ ownerId: userId, value: event.target.value });
            setFeedback((current) =>
              current?.ownerId === userId ? null : current,
            );
          }}
          placeholder={AZ_COPY.admin.reasonPlaceholder}
        />
        <div
          id="admin-action-reason-help"
          className="mt-2 flex min-w-0 flex-wrap justify-between gap-2 text-xs text-[#6b6254]"
        >
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
            {AZ_COPY.admin.reasonHelp}
          </span>
          <span className="shrink-0">{actionReason.length}/1000</span>
        </div>
        {actionBusy && (
          <p role="status" className="mt-3 text-xs text-[#6b6254]">
            {AZ_COPY.admin.actionRecording}
          </p>
        )}
        {visibleFeedback && !actionBusy && (
          <p
            ref={feedbackRef}
            id="admin-action-feedback"
            role={visibleFeedback.type === "error" ? "alert" : "status"}
            aria-atomic="true"
            tabIndex={-1}
            className={`mt-3 text-xs focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213] ${visibleFeedback.type === "error" ? "text-red-700" : "font-bold text-green-800"}`}
          >
            {visibleFeedback.message}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-history-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-history-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.historyTitle}
          </h2>
          <p className="mt-2 break-words text-xs leading-5 text-[#6b6254] [overflow-wrap:anywhere]">
            {AZ_COPY.admin.historyBody}
          </p>
        </div>
        {data.auditLog.length ? (
          <ol
            aria-label={AZ_COPY.admin.historyTitle}
            className="divide-y divide-[#d8cbb5]"
          >
            {data.auditLog.map((entry) => (
              <li
                key={entry.id}
                className="grid min-w-0 gap-3 p-4 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill max-w-full !text-xs">
                      {formatAdminAuditTarget(entry.target_type)}
                    </span>
                    <b className="break-words [overflow-wrap:anywhere]">
                      {formatAdminAuditAction(entry.action)}
                    </b>
                  </div>
                  <p className="mt-2 break-words leading-5 text-[#6b6254] [overflow-wrap:anywhere]">
                    {entry.reason}
                  </p>
                  <code className="mt-2 block break-all text-xs text-[#6b6254]">
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
                  <span className="mt-2 block break-all text-xs text-[#6b6254]">
                    {AZ_COPY.admin.actor}: {entry.actor_name} · {entry.actor_id}{" "}
                    · {AZ_COPY.admin.target}: {entry.target_id}
                  </span>
                </div>
                <time
                  dateTime={entry.created_at}
                  className="text-xs text-[#6b6254]"
                >
                  {formatAzDateTime(entry.created_at)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.historyEmpty}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-listings-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-listings-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.recentListings}
          </h2>
        </div>
        {data.listings.length ? (
          <div
            role="region"
            aria-label={AZ_COPY.admin.listingsTableLabel}
            tabIndex={0}
            className="overflow-x-auto focus:outline focus:outline-[3px] focus:outline-offset-[-3px] focus:outline-[#8f6213]"
          >
            <table className="w-full min-w-[760px] text-left">
              <caption className="sr-only">
                {AZ_COPY.admin.listingsTableLabel}
              </caption>
              <thead>
                <tr className="border-b border-[#d8cbb5] text-xs uppercase tracking-[.14em] text-[#6b6254]">
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
                      <div className="flex min-w-0 items-center gap-3">
                        <BookCover
                          listing={listing}
                          className="w-9 !p-1"
                          sizes="36px"
                        />
                        <b className="min-w-0 break-words text-xs [overflow-wrap:anywhere]">
                          {listing.title}
                        </b>
                      </div>
                    </td>
                    <td className="break-words text-xs [overflow-wrap:anywhere]">
                      {listing.seller.name}
                    </td>
                    <td>
                      <span className="pill !text-xs">
                        {formatListingStatus(listing.status)}
                      </span>
                    </td>
                    <td className="text-xs">{formatCity(listing.city)}</td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`${AZ_COPY.admin.approve}: ${listing.title}`}
                          aria-describedby="admin-action-reason-help"
                          disabled={actionBusy}
                          onClick={() => moderate(listing.id, "approve")}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eee3c8] text-[#8f6213] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Check aria-hidden="true" size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${AZ_COPY.admin.reject}: ${listing.title}`}
                          aria-describedby="admin-action-reason-help"
                          disabled={actionBusy}
                          onClick={() => moderate(listing.id, "reject")}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <X aria-hidden="true" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.listingsEmpty}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-readers-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-readers-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.readerAccounts}
          </h2>
        </div>
        {data.users.length ? (
          <ul
            aria-label={AZ_COPY.admin.readerAccountsListLabel}
            className="divide-y divide-[#d8cbb5]"
          >
            {data.users.map((user) => (
              <li
                key={user.id}
                className="flex min-w-0 items-center justify-between gap-4 p-4 max-[430px]:flex-col max-[430px]:items-stretch"
              >
                <div className="min-w-0">
                  <b className="block break-words text-sm [overflow-wrap:anywhere]">
                    {user.name}
                  </b>
                  <span className="block break-all text-xs text-[#6b6254]">
                    {user.email} ·{" "}
                    {user.city
                      ? formatCity(user.city)
                      : AZ_COPY.admin.noLocation}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`${user.banned ? AZ_COPY.admin.unban : AZ_COPY.admin.ban}: ${user.name}`}
                  aria-describedby="admin-action-reason-help"
                  disabled={actionBusy}
                  onClick={() => ban(user.id, !user.banned)}
                  className={`min-h-11 shrink-0 max-[430px]:w-full ${
                    user.banned ? "btn-secondary" : "btn-dark"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {user.banned ? AZ_COPY.admin.unban : AZ_COPY.admin.ban}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.readersEmpty}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-reports-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-reports-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.openReports}
          </h2>
        </div>
        {data.reports.length ? (
          <ul
            aria-label={AZ_COPY.admin.reportsListLabel}
            className="divide-y divide-[#d8cbb5]"
          >
            {data.reports.map((report) => (
              <li
                key={report.id}
                className="flex min-w-0 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <b className="block break-words text-sm [overflow-wrap:anywhere]">
                    {report.reason}
                  </b>
                  <span className="block break-all text-xs text-[#6b6254]">
                    {AZ_COPY.admin.reportListing}:{" "}
                    {report.listing_id || AZ_COPY.admin.generalReport}
                  </span>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 max-[430px]:flex-col">
                  <button
                    type="button"
                    aria-label={`${AZ_COPY.admin.resolve}: ${report.reason}`}
                    aria-describedby="admin-action-reason-help"
                    disabled={actionBusy}
                    onClick={() => resolveReport(report.id, "resolved")}
                    className="btn-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-40 max-[430px]:w-full"
                  >
                    {AZ_COPY.admin.resolve}
                  </button>
                  <button
                    type="button"
                    aria-label={`${AZ_COPY.admin.dismiss}: ${report.reason}`}
                    aria-describedby="admin-action-reason-help"
                    disabled={actionBusy}
                    onClick={() => resolveReport(report.id, "dismissed")}
                    className="btn-ghost min-h-11 disabled:cursor-not-allowed disabled:opacity-40 max-[430px]:w-full"
                  >
                    {AZ_COPY.admin.dismiss}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.reportsEmpty}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-privacy-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-privacy-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.privacyRequests}
          </h2>
        </div>
        {data.privacyRequests.length ? (
          <ul
            aria-label={AZ_COPY.admin.privacyRequestsListLabel}
            className="divide-y divide-[#d8cbb5]"
          >
            {data.privacyRequests.map((item) => (
              <li key={item.id} className="min-w-0 p-4">
                <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <b className="block break-words text-sm [overflow-wrap:anywhere]">
                      {formatPrivacyRequestType(item.type)} ·{" "}
                      {formatPrivacyRequestStatus(item.status)}
                    </b>
                    <p className="mt-2 max-w-2xl break-words text-xs leading-5 text-[#6b6254] [overflow-wrap:anywhere]">
                      {item.details}
                    </p>
                    <span className="mt-1 block break-all text-xs text-[#6b6254]">
                      {AZ_COPY.admin.user}: {item.user_id}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 max-[430px]:flex-col">
                    <button
                      type="button"
                      aria-label={`${AZ_COPY.admin.reviewing}: ${formatPrivacyRequestType(item.type)}, ${item.user_id}`}
                      aria-describedby="admin-action-reason-help"
                      disabled={actionBusy}
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "in_progress")
                      }
                      className="btn-ghost min-h-11 disabled:cursor-not-allowed disabled:opacity-40 max-[430px]:w-full"
                    >
                      {AZ_COPY.admin.reviewing}
                    </button>
                    <button
                      type="button"
                      aria-label={`${AZ_COPY.admin.complete}: ${formatPrivacyRequestType(item.type)}, ${item.user_id}`}
                      aria-describedby="admin-action-reason-help"
                      disabled={actionBusy}
                      onClick={() =>
                        resolvePrivacyRequest(item.id, "completed")
                      }
                      className="btn-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-40 max-[430px]:w-full"
                    >
                      {AZ_COPY.admin.complete}
                    </button>
                    <button
                      type="button"
                      aria-label={`${AZ_COPY.admin.privacyReject}: ${formatPrivacyRequestType(item.type)}, ${item.user_id}`}
                      aria-describedby="admin-action-reason-help"
                      disabled={actionBusy}
                      onClick={() => resolvePrivacyRequest(item.id, "rejected")}
                      className="btn-ghost min-h-11 disabled:cursor-not-allowed disabled:opacity-40 max-[430px]:w-full"
                    >
                      {AZ_COPY.admin.privacyReject}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.privacyEmpty}
          </p>
        )}
      </section>
      <section
        className="card mt-8 min-w-0"
        aria-labelledby="admin-moderation-title"
      >
        <div className="border-b border-[#d8cbb5] p-5">
          <h2
            id="admin-moderation-title"
            tabIndex={-1}
            className="display scroll-mt-28 break-words text-2xl font-semibold [overflow-wrap:anywhere] focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-[#8f6213]"
          >
            {AZ_COPY.admin.contentRuleDecisions}
          </h2>
          <p className="mt-2 break-words text-xs leading-5 text-[#6b6254] [overflow-wrap:anywhere]">
            {AZ_COPY.admin.contentRuleDecisionsBody}
          </p>
        </div>
        {data.moderationDecisions.length ? (
          <ol
            aria-label={AZ_COPY.admin.contentRuleListLabel}
            className="divide-y divide-[#d8cbb5]"
          >
            {data.moderationDecisions.map((decision) => (
              <li
                key={decision.id}
                className="grid min-w-0 gap-3 p-4 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill max-w-full !text-xs">
                      {formatModerationOutcome(decision.outcome)}
                    </span>
                    <b className="break-words [overflow-wrap:anywhere]">
                      {formatModerationSurface(decision.surface)}
                    </b>
                    <span className="break-words text-[#6b6254] [overflow-wrap:anywhere]">
                      {formatModerationContentType(decision.content_type)} ·{" "}
                      {formatModerationProvider(decision.provider)}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-[#6b6254] [overflow-wrap:anywhere]">
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
                  <span className="mt-1 block break-all text-xs text-[#6b6254]">
                    {AZ_COPY.admin.actor}:{" "}
                    {decision.actor?.name ?? AZ_COPY.admin.deletedAccount}
                    {decision.target_id
                      ? ` · ${AZ_COPY.admin.target}: ${decision.target_id}`
                      : ""}
                  </span>
                </div>
                <time
                  dateTime={decision.created_at}
                  className="text-xs text-[#6b6254]"
                >
                  {formatAzDateTime(decision.created_at)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="p-6 text-xs text-[#6b6254]">
            {AZ_COPY.admin.moderationEmpty}
          </p>
        )}
      </section>
      <div className="mt-8 flex min-w-0 gap-3 rounded-xl border border-[#d8cbb5] bg-[#fffaf0]/60 p-5">
        <ShieldCheck
          aria-hidden="true"
          size={18}
          className="shrink-0 text-[#8f6213]"
        />
        <p className="min-w-0 break-words text-xs leading-5 text-[#6b6254] [overflow-wrap:anywhere]">
          {AZ_COPY.admin.securityNote}
        </p>
      </div>
    </div>
  );
}
