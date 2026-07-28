"use client";

import { useReportWebVitals } from "next/web-vitals";
import { createWebVitalPayload } from "@/lib/web-vitals";

const WEB_VITALS_ENDPOINT = "/api/vitals";

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const ignoreWebVital: ReportWebVitalsCallback = () => {};

const reportWebVital: ReportWebVitalsCallback = (metric) => {
  const payload = createWebVitalPayload({
    name: metric.name,
    value: metric.value,
    navigationType: metric.navigationType,
    pathname: window.location.pathname,
  });
  if (!payload) return;

  const body = JSON.stringify(payload);
  if (
    navigator.sendBeacon?.(
      WEB_VITALS_ENDPOINT,
      new Blob([body], { type: "application/json" }),
    )
  ) {
    return;
  }

  void fetch(WEB_VITALS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // RUM is best-effort and must never interrupt the reader journey.
  });
};

export function WebVitalsReporter({ enabled }: { enabled: boolean }) {
  useReportWebVitals(enabled ? reportWebVital : ignoreWebVital);
  return null;
}
