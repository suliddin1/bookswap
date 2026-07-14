"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/client-api";
import {
  AZ_COPY,
  formatAzDate,
  formatPrivacyRequestStatus,
  formatPrivacyRequestType,
  localizeApiError,
} from "@/lib/i18n";
import type { FormEvent } from "react";

const requestTypes = [
  "access",
  "correction",
  "export",
  "deletion",
  "objection",
  "appeal",
] as const;

type RequestItem = {
  id: string;
  type: string;
  status: string;
  created_at: string;
};

export function PrivacyRequestForm() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
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
        if (active) setItems(body.data ?? []);
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
    };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    setBusy(true);
    setStatusIsError(false);
    setStatus(AZ_COPY.privacyRequests.sending);
    const form = new FormData(formElement);
    try {
      const response = await authFetch("/api/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.get("type"),
          details: form.get("details"),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          localizeApiError(body.code, AZ_COPY.privacyRequests.failed),
        );
      setItems((current) => [body.data, ...current]);
      formElement.reset();
      setStatus(AZ_COPY.privacyRequests.submitted);
    } catch {
      setStatusIsError(true);
      setStatus(AZ_COPY.privacyRequests.failed);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <p className="card mt-5 p-6 text-xs text-gray-600" role="status">
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
      <form onSubmit={submit} className="card grid gap-4 p-6" aria-busy={busy}>
        <label>
          <span className="mb-2 block text-[9px] font-bold uppercase">
            {AZ_COPY.privacyRequests.type}
          </span>
          <select name="type" className="input" required>
            {requestTypes.map((type) => (
              <option key={type} value={type}>
                {formatPrivacyRequestType(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[9px] font-bold uppercase">
            {AZ_COPY.privacyRequests.details}
          </span>
          <textarea
            required
            minLength={10}
            maxLength={2000}
            name="details"
            className="input min-h-[120px] py-3"
            placeholder={AZ_COPY.privacyRequests.detailsPlaceholder}
            aria-describedby="privacy-request-details-help"
          />
        </label>
        <p
          id="privacy-request-details-help"
          className="text-[9px] leading-5 text-gray-500"
        >
          {AZ_COPY.privacyRequests.detailsHelp}
        </p>
        {status && (
          <p
            role={statusIsError ? "alert" : "status"}
            className={`text-[10px] ${statusIsError ? "text-red-700" : "text-gray-600"}`}
          >
            {status}
          </p>
        )}
        <button disabled={busy} className="btn-primary disabled:opacity-50">
          {busy
            ? AZ_COPY.privacyRequests.sending
            : AZ_COPY.privacyRequests.submit}
        </button>
      </form>

      <div className="mt-5">
        <h3 className="text-xs font-bold">{AZ_COPY.privacyRequests.recent}</h3>
        {!loaded ? (
          <p className="mt-2 text-[10px] text-gray-600" role="status">
            {AZ_COPY.privacyRequests.loading}
          </p>
        ) : loadError ? (
          <p role="alert" className="mt-2 text-[10px] text-red-700">
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-2 text-[10px] text-gray-600">
            {AZ_COPY.privacyRequests.empty}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[#d8cbb5] rounded-xl border border-[#d8cbb5]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 p-3 text-[10px] sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <b className="block">{formatPrivacyRequestType(item.type)}</b>
                  <time
                    dateTime={item.created_at}
                    className="mt-1 block text-gray-500"
                  >
                    {formatAzDate(item.created_at)}
                  </time>
                </span>
                <span className="pill w-fit">
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
