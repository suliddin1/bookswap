"use client";

import { useState } from "react";
import { ArrowRight, Check, Mail, Wand2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { AZ_COPY, localizeAuthError } from "@/lib/i18n";
import type { CSSProperties, FormEvent } from "react";

type Mode = "login" | "signup" | "reset" | "sent";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return setError(AZ_COPY.auth.configurationUnavailable);
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        setMode("sent");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMode("sent");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/profile";
      }
    } catch (reason) {
      setError(localizeAuthError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    const supabase = getSupabaseClient();
    if (!supabase) return setError(AZ_COPY.auth.configurationUnavailable);
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/profile` },
    });
    setBusy(false);
    if (error) setError(localizeAuthError(error));
    else setMode("sent");
  }

  if (mode === "sent")
    return (
      <div className="container-shell grid min-h-[680px] place-items-center py-16">
        <div className="card max-w-md p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eee3c8] text-orange">
            <Check size={22} />
          </span>
          <h1 className="display mt-6 text-4xl font-semibold">
            {AZ_COPY.auth.sentTitle}
          </h1>
          <p className="mt-4 text-xs leading-6 text-gray-500">
            {AZ_COPY.auth.sentBody}
          </p>
          <button
            onClick={() => setMode("login")}
            className="btn-secondary mt-7"
          >
            {AZ_COPY.auth.backToSignIn}
          </button>
        </div>
      </div>
    );

  return (
    <div className="desk-surface relative grid min-h-[calc(100vh-74px)] place-items-center overflow-hidden p-5 py-14">
      <div className="spine-stack absolute bottom-0 left-8 hidden opacity-70 lg:flex">
        {AZ_COPY.auth.decorativeTitles.slice(0, 5).map((title, index) => (
          <span
            key={title}
            className="spine"
            style={
              {
                "--spine-color": [
                  "#63372d",
                  "#263d35",
                  "#49364e",
                  "#806428",
                  "#24394a",
                ][index],
                height: `${135 + index * 13}px`,
              } as CSSProperties
            }
          >
            {title}
          </span>
        ))}
      </div>
      <div className="spine-stack absolute bottom-0 right-8 hidden opacity-70 lg:flex">
        {AZ_COPY.auth.decorativeTitles.slice(5).map((title, index) => (
          <span
            key={title}
            className="spine"
            style={
              {
                "--spine-color": ["#304c42", "#775d28", "#56312c", "#2e4053"][
                  index
                ],
                height: `${155 - index * 10}px`,
              } as CSSProperties
            }
          >
            {title}
          </span>
        ))}
      </div>
      <section className="catalog-drawer relative z-10 w-full max-w-md rounded-sm p-6 shadow-[0_30px_70px_rgba(0,0,0,.32)] md:p-9">
        <form onSubmit={submit}>
          <span className="bookmark-badge">
            {mode === "signup"
              ? AZ_COPY.auth.signupBadge
              : mode === "reset"
                ? AZ_COPY.auth.recoveryBadge
                : AZ_COPY.auth.loginBadge}
          </span>
          <h1 className="display mt-4 text-4xl font-semibold">
            {mode === "signup"
              ? AZ_COPY.auth.signupTitle
              : mode === "reset"
                ? AZ_COPY.auth.recoveryTitle
                : AZ_COPY.auth.loginTitle}
          </h1>
          <p className="mt-3 text-xs leading-6 text-gray-500">
            {AZ_COPY.auth.intro}
          </p>
          <div className="mt-7 space-y-4">
            {mode === "signup" && (
              <Field
                label={AZ_COPY.auth.name}
                value={name}
                onChange={setName}
                placeholder={AZ_COPY.auth.namePlaceholder}
              />
            )}
            <Field
              label={AZ_COPY.auth.email}
              value={email}
              onChange={setEmail}
              placeholder={AZ_COPY.auth.emailPlaceholder}
              type="email"
            />
            {mode !== "reset" && (
              <Field
                label={AZ_COPY.auth.password}
                value={password}
                onChange={setPassword}
                placeholder={AZ_COPY.auth.passwordPlaceholder}
                type="password"
                minLength={8}
              />
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-[10px] leading-5 text-red-700"
              >
                {error}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full">
              {busy
                ? AZ_COPY.auth.busy
                : mode === "signup"
                  ? AZ_COPY.auth.createAccount
                  : mode === "reset"
                    ? AZ_COPY.auth.sendReset
                    : AZ_COPY.auth.signIn}{" "}
              <ArrowRight size={15} />
            </button>
          </div>
          {mode !== "reset" && (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#ded4c1]" />
                <span className="text-[9px] font-bold text-gray-400">
                  {AZ_COPY.auth.separator}
                </span>
                <span className="h-px flex-1 bg-[#ded4c1]" />
              </div>
              <button
                type="button"
                onClick={magicLink}
                disabled={!email || busy}
                className="btn-secondary w-full"
              >
                <Wand2 size={15} /> {AZ_COPY.auth.magicLink}
              </button>
            </>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-4 text-[10px] font-bold text-gray-500">
            <button
              type="button"
              className="text-orange"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup"
                ? AZ_COPY.auth.alreadyMember
                : AZ_COPY.auth.createPrompt}
            </button>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="flex items-center gap-1"
              >
                <Mail size={11} /> {AZ_COPY.auth.forgotPassword}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  minLength?: number;
}) {
  return (
    <label>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">
        {label}
      </span>
      <input
        required
        minLength={minLength}
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
