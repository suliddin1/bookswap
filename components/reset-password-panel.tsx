"use client";

import { useState } from "react";
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setStatusIsError(true);
      return setStatus(AZ_COPY.resetPassword.minLength);
    }
    if (password !== confirmation) {
      setStatusIsError(true);
      return setStatus(AZ_COPY.resetPassword.mismatch);
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatusIsError(true);
      return setStatus(AZ_COPY.auth.configurationUnavailable);
    }
    setBusy(true);
    setStatusIsError(false);
    setStatus(AZ_COPY.resetPassword.updating);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatusIsError(true);
        setStatus(localizeAuthError(error, AZ_COPY.resetPassword.failed));
      } else setComplete(true);
    } catch (error) {
      setStatusIsError(true);
      setStatus(localizeAuthError(error, AZ_COPY.resetPassword.failed));
    } finally {
      setBusy(false);
    }
  }

  if (complete)
    return (
      <div className="container-shell grid min-h-[650px] place-items-center">
        <div className="card max-w-md p-9 text-center">
          <Check className="mx-auto text-orange" />
          <h1 className="display mt-5 text-4xl font-semibold">
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
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <span className="bookmark-badge">{AZ_COPY.resetPassword.badge}</span>
        <h1 className="display mt-5 text-4xl font-semibold">
          {AZ_COPY.resetPassword.title}
        </h1>
        <label className="mt-6 block">
          <span className="mb-2 block text-[9px] font-bold uppercase">
            {AZ_COPY.resetPassword.newPassword}
          </span>
          <input
            required
            minLength={8}
            maxLength={128}
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-[9px] font-bold uppercase">
            {AZ_COPY.resetPassword.confirmPassword}
          </span>
          <input
            required
            minLength={8}
            maxLength={128}
            type="password"
            className="input"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        {status && (
          <p
            role={statusIsError ? "alert" : "status"}
            className={`mt-3 text-[10px] ${statusIsError ? "text-red-700" : "text-gray-600"}`}
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
