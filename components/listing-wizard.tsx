"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ImagePlus, ShieldCheck, X } from "lucide-react";
import { authFetch } from "@/lib/client-api";
import { BookCover } from "@/components/book-cover";
import type { Listing } from "@/lib/types";

const steps = ["Book details", "Condition", "Photos & price", "Review"];
const initial = { title: "", author: "", isbn: "", category: "Fiction", city: "Baku", description: "", condition: "Very good", price: "" };

export function ListingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  function update(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function chooseImages(event: ChangeEvent<HTMLInputElement>) { setFiles(Array.from(event.target.files ?? []).slice(0, 5)); }
  function canContinue() {
    if (step === 0) return form.title.length > 1 && form.author.length > 1 && form.description.length >= 10;
    if (step === 2) return Number(form.price) > 0 && files.length > 0;
    return true;
  }

  async function publish() {
    setBusy(true);
    setError("");
    try {
      const upload = new FormData();
      files.forEach((file) => upload.append("images", file));
      const uploadResponse = await authFetch("/api/upload", { method: "POST", body: upload });
      const uploadBody = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadBody.error);
      const response = await authFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), images: uploadBody.data }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish listing.");
    } finally {
      setBusy(false);
    }
  }

  const preview: Listing = { id: "preview", title: form.title || "Your book title", author: form.author || "Author", description: form.description, price: Number(form.price) || 0, category: form.category, condition: form.condition, city: form.city, status: "active", seller: { id: "", name: "" }, color: "#243a31", accent: "#d7b764", images: files[0] ? [URL.createObjectURL(files[0])] : [] };

  if (complete) return <div className="container-shell grid min-h-[650px] place-items-center py-16"><div className="card max-w-lg p-10 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eee3c8] text-orange"><Check size={28} /></span><h1 className="display mt-6 text-4xl font-semibold">Your book is live.</h1><p className="mt-4 text-sm leading-7 text-gray-500">It now appears on the real BookSwap marketplace.</p><div className="mt-7 flex justify-center gap-3"><Link href="/profile" className="btn-secondary">My shelf</Link><Link href="/listings" className="btn-primary">Browse books</Link></div></div></div>;

  return (
    <div className="container-shell py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between"><Link href="/profile" className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><X size={14} /> Cancel</Link><span className="text-[9px] text-gray-400">Secure Supabase listing</span></div>
        <div className="mt-10 text-center"><span className="eyebrow">Pass it forward</span><h1 className="display mt-4 text-5xl font-semibold">List a book.</h1><p className="mt-3 text-xs text-gray-500">A clean, considered listing helps the right reader find it.</p></div>
        <div className="mt-10 flex items-center justify-between">{steps.map((item, index) => <div key={item} className="flex flex-1 items-center last:flex-none"><div className="flex flex-col items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold ${index <= step ? "border-orange bg-orange text-white" : "border-[#d8cbb5] bg-[#fffaf0]"}`}>{index < step ? <Check size={13} /> : index + 1}</span><span className={`hide-mobile text-[9px] font-bold ${index === step ? "text-ink" : "text-gray-400"}`}>{item}</span></div>{index < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${index < step ? "bg-orange" : "bg-[#d8cbb5]"}`} />}</div>)}</div>
        <div className="card mt-10 p-6 md:p-10">
          {step === 0 && <div><Heading title="Tell us about the book." body="Use accurate details so readers can find it." /><div className="mt-7 grid gap-5"><Field label="ISBN (optional)" value={form.isbn} setValue={(v) => update("isbn",v)} /><div className="grid gap-5 md:grid-cols-2"><Field label="Title" value={form.title} setValue={(v) => update("title",v)} /><Field label="Author / subject" value={form.author} setValue={(v) => update("author",v)} /></div><div className="grid gap-5 md:grid-cols-2"><Select label="Category" value={form.category} setValue={(v) => update("category",v)} options={["Fiction","Business","Design","Science","History","Children","Academic"]} /><Field label="Location" value={form.city} setValue={(v) => update("city",v)} /></div><label><Label>Description</Label><textarea className="input min-h-[130px] resize-none py-3" value={form.description} onChange={(e) => update("description",e.target.value)} placeholder="Condition notes, edition details, and anything the next reader should know..." /></label></div></div>}
          {step === 1 && <div><Heading title="How has it been loved?" body="Honest condition notes build trust." /><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Like new","Very good","Good","Well read"].map((item) => <button key={item} onClick={() => update("condition",item)} className={`rounded-xl border p-5 text-left text-xs font-bold transition ${form.condition === item ? "border-orange bg-[#f4ead2]" : "border-[#ded4c1]"}`}>{item}{form.condition === item && <Check size={14} className="float-right text-orange" />}</button>)}</div></div>}
          {step === 2 && <div><Heading title="Show the real copy." body="Upload one to five clear JPEG, PNG, or WebP images, each under 5 MB." /><label className="mt-7 grid min-h-[180px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#bfae8d] bg-[#fffaf0]/55 text-center"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} /><span><ImagePlus size={24} className="mx-auto text-orange" /><b className="mt-3 block text-xs">Choose book photos</b><span className="mt-2 block text-[9px] text-gray-500">{files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "Cover, spine, and any signs of wear"}</span></span></label><div className="mt-6"><Field label="Price (AZN)" value={form.price} setValue={(v) => update("price",v)} type="number" /></div><p className="mt-4 flex items-center gap-2 text-[9px] text-gray-500"><ShieldCheck size={13} className="text-orange" /> Uploads are stored in the protected listing-images bucket.</p></div>}
          {step === 3 && <div><Heading title="Ready for its next chapter?" body="Review the public card before publishing." /><div className="mx-auto mt-7 grid max-w-md gap-5 rounded-xl border border-[#ded4c1] p-6 sm:grid-cols-[120px_1fr]"><BookCover listing={preview} /><div><span className="pill">Preview</span><h3 className="display mt-4 text-2xl font-semibold">{preview.title}</h3><p className="mt-1 text-xs text-gray-500">{preview.author}</p><strong className="display mt-6 block text-2xl text-orange">₼{preview.price}</strong></div></div></div>}
          {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-[10px] text-red-700">{error}</p>}
        </div>
        <div className="mt-6 flex justify-between"><button className="btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft size={15} /> Back</button><button disabled={!canContinue() || busy} className="btn-primary disabled:opacity-50" onClick={() => step === 3 ? publish() : setStep(step + 1)}>{busy ? "Publishing..." : step === 3 ? "Publish listing" : "Continue"} <ArrowRight size={15} /></button></div>
      </div>
    </div>
  );
}

function Heading({ title, body }: { title: string; body: string }) { return <div><h2 className="display text-3xl font-semibold">{title}</h2><p className="mt-2 text-xs text-gray-500">{body}</p></div>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-gray-500">{children}</span>; }
function Field({ label, value, setValue, type = "text" }: { label: string; value: string; setValue: (value: string) => void; type?: string }) { return <label><Label>{label}</Label><input className="input" type={type} value={value} onChange={(e) => setValue(e.target.value)} /></label>; }
function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) { return <label><Label>{label}</Label><select className="input" value={value} onChange={(e) => setValue(e.target.value)}>{options.map((item) => <option key={item}>{item}</option>)}</select></label>; }
