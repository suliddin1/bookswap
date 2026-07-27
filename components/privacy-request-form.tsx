"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  parsePrivacyRequestListResponse,
  parsePrivacyRequestSubmissionResponse,
  PRIVACY_REQUEST_TYPES,
  type PrivacyRequestItem,
  type PrivacyRequestType,
} from "@/lib/account-responses";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAzDate,
  formatPrivacyRequestStatus,
  formatPrivacyRequestType,
  localizeApiError,
} from "@/lib/i18n";
import type { FormEvent } from "react";

export function PrivacyRequestForm() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<PrivacyRequestItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [detailsInvalid, setDetailsInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const userIdRef = useRef(userId);
  const submissionSequenceRef = useRef(0);
  const activeSubmissionRef = useRef<{
    requestId: number;
    ownerId: string;
    controller: AbortController;
  } | null>(null);
  const focusLoadError = useCallback((element: HTMLParagraphElement | null) => {
    element?.focus();
  }, []);
  userIdRef.current = userId;

  function beginSubmission() {
    const ownerId = userId;
    if (
      !ownerId ||
      userIdRef.current !== ownerId ||
      activeSubmissionRef.current
    )
      return null;
    const context = {
      requestId: ++submissionSequenceRef.current,
      ownerId,
      controller: new AbortController(),
    };
    activeSubmissionRef.current = context;
    setBusy(true);
    setDetailsInvalid(false);
    setStatusIsError(false);
    setStatus(AZ_COPY.privacyRequests.sending);
    return context;
  }

  function isCurrentSubmission(context: {
    requestId: number;
    ownerId: string;
  }) {
    const activeSubmission = activeSubmissionRef.current;
    return (
      activeSubmission?.requestId === context.requestId &&
      activeSubmission.ownerId === context.ownerId &&
      userIdRef.current === context.ownerId
    );
  }

  function finishSubmission(context: { requestId: number; ownerId: string }) {
    if (!isCurrentSubmission(context)) return;
    activeSubmissionRef.current = null;
    setBusy(false);
  }

  useEffect(() => {
    submissionSequenceRef.current += 1;
    activeSubmissionRef.current?.controller.abort();
    activeSubmissionRef.current = null;
    setBusy(false);
    setStatus("");
    setStatusIsError(false);
    setDetailsInvalid(false);
    if (!userId) {
      setItems([]);
      setLoaded(false);
      setLoadError("");
      return;
    }

    const controller = new AbortController();
    let active = true;
    setItems([]);
    setLoaded(false);
    setLoadError("");

    void authFetch("/api/privacy-requests", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            localizeApiError(body.code, AZ_COPY.privacyRequests.loadFailed),
          );
        const parsedItems = parsePrivacyRequestListResponse(body);
        if (!parsedItems) throw new Error(AZ_COPY.privacyRequests.loadFailed);
        if (active)
          setItems((current) => [
            ...current.filter(
              (item) =>
                !parsedItems.some((parsedItem) => parsedItem.id === item.id),
            ),
            ...parsedItems,
          ]);
      })
      .catch((reason) => {
        if (active && reason?.name !== "AbortError")
          setLoadError(AZ_COPY.privacyRequests.loadFailed);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
      controller.abort();
      const activeSubmission = activeSubmissionRef.current;
      if (activeSubmission?.ownerId === userId) {
        activeSubmission.controller.abort();
        activeSubmissionRef.current = null;
      }
    };
  }, [userId]);

  useEffect(() => {
    if (status && !busy && !detailsInvalid) statusRef.current?.focus();
  }, [busy, detailsInvalid, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeSubmissionRef.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const details = String(form.get("details") ?? "").trim();
    if (details.length < 10) {
      setDetailsInvalid(true);
      setStatusIsError(true);
      setStatus(AZ_COPY.privacyRequests.detailsInvalid);
      requestAnimationFrame(() => detailsRef.current?.focus());
      return;
    }

    const type = PRIVACY_REQUEST_TYPES.find(
      (candidate): candidate is PrivacyRequestType =>
        candidate === form.get("type"),
    );
    if (!type) {
      setStatusIsError(true);
      setStatus(AZ_COPY.privacyRequests.failed);
      return;
    }
    const context = beginSubmission();
    if (!context) return;
    try {
      const response = await authFetch("/api/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          details,
        }),
        signal: context.controller.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.privacyRequests.failed),
        );
      const parsedItem = parsePrivacyRequestSubmissionResponse(body, {
        userId: context.ownerId,
        type,
      });
      if (!parsedItem) throw new Error(AZ_COPY.privacyRequests.failed);
      if (!isCurrentSubmission(context)) return;
      setItems((current) => [
        parsedItem,
        ...current.filter((item) => item.id !== parsedItem.id),
      ]);
      formElement.reset();
      setDetailsInvalid(false);
      setStatus(AZ_COPY.privacyRequests.submitted);
    } catch {
      if (isCurrentSubmission(context)) {
        setStatusIsError(true);
        setStatus(AZ_COPY.privacyRequests.failed);
      }
    } finally {
      finishSubmission(context);
    }
  }

  if (loading)
    return (
      <p
        className="card mt-5 p-4 text-xs leading-5 text-gray-600 sm:p-6"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {AZ_COPY.privacyRequests.loading}
      </p>
    );

  if (!user)
    return (
      <div className="mt-5">
        <EmptyState
          title={AZ_COPY.privacyRequests.authTitle}
          body={AZ_COPY.privacyRequests.authBody}
          action={AZ_COPY.privacyRequests.signIn}
          href="/login"
        />
      </div>
    );

  return (
    <div className="mt-5">
      <form
        key={userId}
        onSubmit={submit}
        noValidate
        className="card grid min-w-0 gap-4 p-4 sm:p-6"
        aria-busy={busy}
      >
        <label>
          <span className="mb-2 block text-xs font-bold uppercase">
            {AZ_COPY.privacyRequests.type}
          </span>
          <select name="type" className="input" required>
            {PRIVACY_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatPrivacyRequestType(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase">
            {AZ_COPY.privacyRequests.details}
          </span>
          <textarea
            ref={detailsRef}
            required
            minLength={10}
            maxLength={2000}
            name="details"
            className="input min-h-[120px] py-3"
            placeholder={AZ_COPY.privacyRequests.detailsPlaceholder}
            aria-invalid={detailsInvalid}
            aria-describedby={`privacy-request-details-help${detailsInvalid ? " privacy-request-status" : ""}`}
            onChange={() => {
              if (detailsInvalid) {
                setDetailsInvalid(false);
                setStatusIsError(false);
                setStatus("");
              }
            }}
          />
        </label>
        <p
          id="privacy-request-details-help"
          className="break-words text-xs leading-5 text-[#6b6254]"
        >
          {AZ_COPY.privacyRequests.detailsHelp}
        </p>
        {status && (
          <p
            ref={statusRef}
            id="privacy-request-status"
            role={statusIsError ? "alert" : "status"}
            aria-live={statusIsError ? "assertive" : "polite"}
            aria-atomic="true"
            tabIndex={-1}
            className={`break-words text-xs leading-5 ${statusIsError ? "text-red-700" : "text-gray-600"}`}
          >
            {status}
          </p>
        )}
        <button
          type="submit"
          aria-disabled={busy}
          className="btn-primary aria-disabled:opacity-50"
        >
          {busy
            ? AZ_COPY.privacyRequests.sending
            : AZ_COPY.privacyRequests.submit}
        </button>
      </form>

      <div className="mt-5">
        <h3 id="privacy-request-history-heading" className="text-xs font-bold">
          {AZ_COPY.privacyRequests.recent}
        </h3>
        {!loaded ? (
          <p
            className="mt-2 text-xs leading-5 text-gray-600"
            role="status"
            aria-live="polite"
          >
            {AZ_COPY.privacyRequests.loading}
          </p>
        ) : loadError ? (
          <p
            ref={focusLoadError}
            role="alert"
            tabIndex={-1}
            className="mt-2 text-xs leading-5 text-red-700"
          >
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-2 text-xs leading-5 text-gray-600">
            {AZ_COPY.privacyRequests.empty}
          </p>
        ) : (
          <ul
            className="mt-2 min-w-0 divide-y divide-[#d8cbb5] rounded-xl border border-[#95866f]"
            aria-labelledby="privacy-request-history-heading"
          >
            {items.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col gap-2 p-3 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <b className="block break-words">
                    {formatPrivacyRequestType(item.type)}
                  </b>
                  <time
                    dateTime={item.created_at}
                    className="mt-1 block break-words text-[#6b6254]"
                  >
                    {formatAzDate(item.created_at)}
                  </time>
                </span>
                <span className="pill max-w-full whitespace-normal text-center !text-xs">
                  {formatPrivacyRequestStatus(item.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
