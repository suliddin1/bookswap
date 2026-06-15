"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Mail, Wand2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

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
    if (!supabase) return setError("Supabase is not configured. Add the public URL and anon key to .env.local.");
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        setMode("sent");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile` });
        if (error) throw error;
        setMode("sent");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/profile";
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    const supabase = getSupabaseClient();
    if (!supabase) return setError("Supabase is not configured.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/profile` } });
    setBusy(false);
    if (error) setError(error.message);
    else setMode("sent");
  }

  if (mode === "sent") return <div className="container-shell grid min-h-[680px] place-items-center py-16"><div className="card max-w-md p-10 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eee3c8] text-orange"><Check size={22} /></span><h1 className="display mt-6 text-4xl font-semibold">Check your inbox.</h1><p className="mt-4 text-xs leading-6 text-gray-500">Your secure BookSwap email is on its way.</p><button onClick={() => setMode("login")} className="btn-secondary mt-7">Back to sign in</button></div></div>;

  return (
    <div className="desk-surface relative grid min-h-[calc(100vh-74px)] place-items-center overflow-hidden p-5 py-14">
      <div className="spine-stack absolute bottom-0 left-8 hidden opacity-70 lg:flex">{["Fiction","History","Design","Essays","Poetry"].map((title,index) => <span key={title} className="spine" style={{ "--spine-color": ["#63372d","#263d35","#49364e","#806428","#24394a"][index], height: `${135 + index * 13}px` } as React.CSSProperties}>{title}</span>)}</div>
      <div className="spine-stack absolute bottom-0 right-8 hidden opacity-70 lg:flex">{["Science","Notes","Literature","Business"].map((title,index) => <span key={title} className="spine" style={{ "--spine-color": ["#304c42","#775d28","#56312c","#2e4053"][index], height: `${155 - index * 10}px` } as React.CSSProperties}>{title}</span>)}</div>
      <section className="catalog-drawer relative z-10 w-full max-w-md rounded-sm p-6 shadow-[0_30px_70px_rgba(0,0,0,.32)] md:p-9">
        <form onSubmit={submit}>
          <span className="bookmark-badge">{mode === "signup" ? "New reader card" : mode === "reset" ? "Account recovery" : "Reader login"}</span>
          <h2 className="display mt-4 text-4xl font-semibold">{mode === "signup" ? "Make room for more stories." : mode === "reset" ? "Reset your password." : "Sign in to your shelf."}</h2>
          <p className="mt-3 text-xs leading-6 text-gray-500">Access your listings, saved books, and reader conversations.</p>
          <div className="mt-7 space-y-4">
            {mode === "signup" && <Field label="Name" value={name} onChange={setName} placeholder="Your name" />}
            <Field label="Email address" value={email} onChange={setEmail} placeholder="reader@example.com" type="email" />
            {mode !== "reset" && <Field label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-[10px] leading-5 text-red-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? "Please wait..." : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"} <ArrowRight size={15} /></button>
          </div>
          {mode !== "reset" && <><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#ded4c1]" /><span className="text-[9px] font-bold text-gray-400">OR</span><span className="h-px flex-1 bg-[#ded4c1]" /></div><button type="button" onClick={magicLink} disabled={!email || busy} className="btn-secondary w-full"><Wand2 size={15} /> Email me a magic link</button></>}
          <div className="mt-7 flex flex-wrap justify-center gap-4 text-[10px] font-bold text-gray-500"><button type="button" className="text-orange" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already a member? Sign in" : "Create an account"}</button>{mode === "login" && <button type="button" onClick={() => setMode("reset")} className="flex items-center gap-1"><Mail size={11} /> Forgot password?</button>}</div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">{label}</span><input required className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
