"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState("");

  const inviterName = request.profiles?.display_name || "A member";
  let typeLabel;
  let description;
  if (request.request_type === "channel_invite") {
    typeLabel = "Channel invite";
    const targetName = request.channels?.name;
    description = targetName ? `invited you to join the "${targetName}" channel` : "invited you to join a channel";
  } else if (request.request_type === "collaborator_invite") {
    typeLabel = "Collaborator invite";
    const targetName = request.articles?.title;
    description = targetName ? `invited you to collaborate on "${targetName}"` : "invited you to collaborate on an article";
  } else {
    typeLabel = "Contact request";
    description = "wants to add you as a contact";
  }

  // Confirmed real bug: this used to call the action and refresh
  // unconditionally, silently ignoring any returned error — Accept
  // could fail an RLS check and the UI would show nothing at all,
  // making it look like the button just didn't work.
  function handle(action) {
    setError("");
    startTransition(async () => {
      const result = await action(request.id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-paper/80 font-body text-sm">
            <span className="font-medium">{inviterName}</span> {description}
          </p>
          <p className="text-paper/30 text-xs font-body mt-1">
            {typeLabel} · {timeAgo(request.created_at)}
            {!request.seen_at && <span className="text-brass-400 ml-2">● New</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handle(acceptRequest)}
            disabled={isPending}
            className="text-ink-950 bg-brass-400 text-xs font-body font-medium rounded-md px-3 py-1.5 hover:bg-brass-300 transition-colors disabled:opacity-50"
          >
            {request.request_type === "contact_invite" ? "Add to Contacts" : "Accept"}
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
      {error && <p className="text-loss text-xs font-body mt-2">{error}</p>}
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
