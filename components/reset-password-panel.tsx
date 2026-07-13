"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export function ResetPasswordPanel() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setStatus("Use at least 8 characters.");
    if (password !== confirmation) return setStatus("Passwords do not match.");
    const supabase = getSupabaseClient();
    if (!supabase) return setStatus("Authentication is not configured.");
    setStatus("Updating...");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setStatus(error.message);
    else setComplete(true);
  }

  if (complete)
    return (
      <div className="container-shell grid min-h-[650px] place-items-center">
        <div className="card max-w-md p-9 text-center">
          <Check className="mx-auto text-orange" />
          <h1 className="display mt-5 text-4xl font-semibold">
            Password updated.
          </h1>
          <Link href="/profile" className="btn-primary mt-6">
            Open dashboard
          </Link>
        </div>
      </div>
    );
  return (
    <div className="container-shell grid min-h-[650px] place-items-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <span className="bookmark-badge">Account recovery</span>
        <h1 className="display mt-5 text-4xl font-semibold">
          Choose a new password.
        </h1>
        <label className="mt-6 block">
          <span className="mb-2 block text-[9px] font-bold uppercase">
            New password
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
            Confirm password
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
        {status && <p className="mt-3 text-[10px] text-red-700">{status}</p>}
        <button className="btn-primary mt-5 w-full">Update password</button>
      </form>
    </div>
  );
}
