"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePostFlagStatus } from "../lib/support-actions";

function FlagCard({ flag, compact }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!compact);
  const [isPending, startTransition] = useTransition();

  const post = flag.discussion_posts;
  const channel = post?.channels;

  function handleAction(status) {
    startTransition(async () => {
      await updatePostFlagStatus(flag.id, status);
      router.refresh();
    });
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900">
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${
              flag.status === "pending" ? "bg-loss/10 text-loss" : "bg-ink-800 text-paper/30"
            }`}>
              {flag.status}
            </span>
            <span className="text-paper/40 text-xs">
              {channel?.visibility === "private" ? "🔒" : "🌐"} {channel?.name}
            </span>
          </div>
          <p className="text-paper/70 text-sm font-body line-clamp-2">
            {post?.content?.slice(0, 120)}{(post?.content?.length || 0) > 120 ? "…" : ""}
          </p>
          <p className="text-paper/30 text-xs font-body mt-1">
            Flagged by {flag.profiles?.display_name}
            {flag.reason && ` · "${flag.reason}"`}
          </p>
        </div>
        <span className="text-paper/30 text-xs shrink-0">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && flag.status === "pending" && (
        <div className="border-t border-ink-800 p-4 flex gap-2">
          <button
            onClick={() => handleAction("dismissed")}
            disabled={isPending}
            className="text-xs font-body text-paper/60 border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors disabled:opacity-40"
          >
            Dismiss (keep post)
          </button>
          <button
            onClick={() => handleAction("reviewed")}
            disabled={isPending}
            className="text-xs font-body text-loss border border-loss/30 rounded-md px-3 py-1.5 hover:bg-loss/10 transition-colors disabled:opacity-40"
          >
            Reviewed (post actioned)
          </button>
        </div>
      )}
    </div>
  );
}

export default function TAFlagManager({ flags, compact = false }) {
  return (
    <div className="space-y-3">
      {flags.map(flag => (
        <FlagCard key={flag.id} flag={flag} compact={compact} />
      ))}
    </div>
  );
}
