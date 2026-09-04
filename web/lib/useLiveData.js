"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes, matching the Worker's cron cadence

/**
 * Polls the standalone live-data Worker (see /worker) for fresh
 * stock/commodity/FX prices. Returns null if NEXT_PUBLIC_LIVE_WORKER_URL
 * isn't set — the rest of the site should treat that as "live data isn't
 * configured yet" and fall back to the daily-computed figures rather than
 * breaking, since the Worker is an optional add-on, not a hard dependency
 * of the static site.
 */
export function useLiveData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const workerUrl = process.env.NEXT_PUBLIC_LIVE_WORKER_URL;

  useEffect(() => {
    if (!workerUrl) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(workerUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Worker returned ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [workerUrl]);

  return { data, error, isConfigured: Boolean(workerUrl) };
}
