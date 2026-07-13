"use client";

import { FormEvent, useEffect, useState } from "react";
import { authFetch } from "@/lib/client-api";

type RequestItem = {
  id: string;
  type: string;
  status: string;
  created_at: string;
};

export function PrivacyRequestForm() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    authFetch("/api/privacy-requests")
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json();
        setItems(body.data ?? []);
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("Sending...");
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
      if (!response.ok) throw new Error(body.error);
      setItems((current) => [body.data, ...current]);
      formElement.reset();
      setStatus("Your request has been recorded.");
    } catch (reason) {
      setStatus(
        reason instanceof Error ? reason.message : "Could not send request.",
      );
    }
  }

  return (
    <div className="mt-5">
      <form onSubmit={submit} className="card grid gap-4 p-6">
        <label>
          <span className="mb-2 block text-[9px] font-bold uppercase">
            Request type
          </span>
          <select name="type" className="input">
            <option value="access">Access my data</option>
            <option value="correction">Correct my data</option>
            <option value="export">Export my data</option>
            <option value="deletion">Delete my account/data</option>
            <option value="objection">Object to processing</option>
            <option value="appeal">Appeal a moderation decision</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[9px] font-bold uppercase">
            Details
          </span>
          <textarea
            required
            minLength={10}
            maxLength={2000}
            name="details"
            className="input min-h-[120px] py-3"
            placeholder="Describe what you want us to review or provide."
          />
        </label>
        {status && (
          <p role="status" className="text-[10px] text-gray-600">
            {status}
          </p>
        )}
        <button className="btn-primary">Submit secure request</button>
      </form>
      {items.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold">Your recent requests</h3>
          <div className="mt-2 divide-y divide-[#d8cbb5] rounded-xl border border-[#d8cbb5]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 text-[10px]"
              >
                <span>{item.type}</span>
                <span className="pill">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
