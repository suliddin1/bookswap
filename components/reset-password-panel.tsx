"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { AZ_COPY, localizeAuthError } from "@/lib/i18n";
import type { FormEvent } from "react";

export function ResetPasswordPanel() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invalidField, setInvalidField] = useState<
    "password" | "confirmation" | null
  >(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const completeHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!status || !statusIsError) return;
    if (invalidField === "password") passwordRef.current?.focus();
    else if (invalidField === "confirmation") confirmationRef.current?.focus();
    else statusRef.current?.focus();
  }, [invalidField, status, statusIsError]);

  useEffect(() => {
    if (complete) completeHeadingRef.current?.focus();
  }, [complete]);

  function showError(
    message: string,
    field: "password" | "confirmation" | null = null,
  ) {
    setStatusIsError(true);
    setInvalidField(field);
    setStatus(message);
  }

  function clearStatus() {
    setStatus("");
    setStatusIsError(false);
    setInvalidField(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      return showError(AZ_COPY.resetPassword.minLength, "password");
    }
    if (password !== confirmation) {
      return showError(AZ_COPY.resetPassword.mismatch, "confirmation");
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return showError(AZ_COPY.auth.configurationUnavailable);
    }
    setBusy(true);
    setStatusIsError(false);
    setInvalidField(null);
    setStatus(AZ_COPY.resetPassword.updating);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showError(localizeAuthError(error, AZ_COPY.resetPassword.failed));
      } else setComplete(true);
    } catch (error) {
      showError(localizeAuthError(error, AZ_COPY.resetPassword.failed));
    } finally {
      setBusy(false);
    }
  }

  if (complete)
    return (
      <div className="container-shell grid min-h-[650px] place-items-center">
        <div className="card min-w-0 max-w-md p-5 text-center sm:p-9">
          <Check aria-hidden="true" className="mx-auto text-orange" />
          <h1
            ref={completeHeadingRef}
            tabIndex={-1}
            className="display mt-5 break-words text-3xl font-semibold sm:text-4xl"
          >
            {AZ_COPY.resetPassword.completeTitle}
          </h1>
          <Link href="/profile" className="btn-primary mt-6">
            {AZ_COPY.resetPassword.openDashboard}
          </Link>
        </div>
      </div>
    );
  return (
    <div className="container-shell grid min-h-[650px] place-items-center py-16">
      <form
        noValidate
        onSubmit={submit}
        aria-busy={busy}
        className="card w-full min-w-0 max-w-md p-5 sm:p-8"
      >
        <span className="bookmark-badge">{AZ_COPY.resetPassword.badge}</span>
        <h1 className="display mt-5 break-words text-3xl font-semibold sm:text-4xl">
          {AZ_COPY.resetPassword.title}
        </h1>
        <div className="mt-6">
          <label className="block">
            <span className="mb-2 block break-words text-xs font-extrabold uppercase tracking-[.13em] text-muted">
              {AZ_COPY.resetPassword.newPassword}
            </span>
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              ref={passwordRef}
              className="input"
              autoComplete="new-password"
              aria-invalid={invalidField === "password"}
              aria-describedby={
                status
                  ? "reset-password-hint reset-password-status"
                  : "reset-password-hint"
              }
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearStatus();
              }}
            />
          </label>
          <span
            id="reset-password-hint"
            className="mt-2 block text-xs leading-5 text-muted"
          >
            {AZ_COPY.resetPassword.minLength}
          </span>
        </div>
        <label className="mt-4 block">
          <span className="mb-2 block break-words text-xs font-extrabold uppercase tracking-[.13em] text-muted">
            {AZ_COPY.resetPassword.confirmPassword}
          </span>
          <input
            required
            minLength={8}
            maxLength={128}
            type="password"
            ref={confirmationRef}
            className="input"
            autoComplete="new-password"
            aria-invalid={invalidField === "confirmation"}
            aria-describedby={status ? "reset-password-status" : undefined}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
              clearStatus();
            }}
          />
        </label>
        {status && (
          <p
            ref={statusRef}
            id="reset-password-status"
            role={statusIsError ? "alert" : "status"}
            tabIndex={statusIsError && !invalidField ? -1 : undefined}
            className={`mt-3 text-sm leading-6 ${statusIsError ? "text-red-700" : "text-muted"}`}
          >
            {status}
          </p>
        )}
        <button
          disabled={busy}
          className="btn-primary mt-5 w-full disabled:opacity-50"
        >
          {busy ? AZ_COPY.resetPassword.updating : AZ_COPY.resetPassword.update}
        </button>
      </form>
    </div>
  );
}
