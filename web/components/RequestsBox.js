"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptRequest, denyRequest, markRequestSeen } from "../lib/request-actions";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RequestRow({ request }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isChannelInvite = request.request_type === "channel_invite";
  const targetName = isChannelInvite ? request.channels?.name : request.articles?.title;
  const inviterName = request.profiles?.display_name || "A member";
  const description = isChannelInvite
    ? targetName
      ? `invited you to join the "${targetName}" channel`
      : "invited you to join a channel"
    : targetName
    ? `invited you to collaborate on "${targetName}"`
    : "invited you to collaborate on an article";

  function handle(action) {
    startTransition(async () => {
      await action(request.id);
      router.refresh();
    });
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-paper/80 font-body text-sm">
          <span className="font-medium">{inviterName}</span> {description}
        </p>
        <p className="text-paper/30 text-xs font-body mt-1">
          {isChannelInvite ? "Channel invite" : "Collaborator invite"} · {timeAgo(request.created_at)}
          {!request.seen_at && <span className="text-brass-400 ml-2">● New</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => handle(acceptRequest)}
          disabled={isPending}
          className="text-ink-950 bg-brass-400 text-xs font-body font-medium rounded-md px-3 py-1.5 hover:bg-brass-300 transition-colors disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={() => handle(denyRequest)}
          disabled={isPending}
          className="text-loss text-xs font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Deny
        </button>
        <button
          onClick={() => handle(markRequestSeen)}
          disabled={isPending}
          className="text-paper/50 text-xs font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          Wait
        </button>
      </div>
    </div>
  );
}

export default function RequestsBox({ requests }) {
  if (requests.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
        Requests ({requests.length})
      </p>
      <div className="space-y-2">
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </div>
    </div>
  );
}
