"use client";

import { useLiveData } from "../lib/useLiveData";

export default function LiveStatusIndicator() {
  const { data, error, isConfigured } = useLiveData();

  if (!isConfigured) return null; // live Worker not set up yet — show nothing rather than a broken badge

  const isFresh =
    data?.updated_at && Date.now() - new Date(data.updated_at).getTime() < 5 * 60 * 1000;

  return (
    <span className="flex items-center gap-1.5 text-xs font-mono text-paper/50" title={error || ""}>
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          isFresh ? "bg-gain" : "bg-loss"
        }`}
      />
      {isFresh ? "Live" : error ? "Live feed error" : "Live feed stale"}
    </span>
  );
}
