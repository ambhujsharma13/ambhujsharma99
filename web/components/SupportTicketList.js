"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTicketVote } from "../lib/support-actions";

const STATUS_STYLES = {
  open: "text-paper/50",
  in_progress: "text-brass-400",
  resolved: "text-gain",
  wont_fix: "text-paper/30",
  duplicate: "text-paper/30",
};

function timeAgo(dateString) {
  const d = Math.floor((Date.now() - new Date(dateString)) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function TicketRow({ ticket, voted, currentUserId }) {
  const router = useRouter();
  const [localVoted, setLocalVoted] = useState(voted);
  const [localCount, setLocalCount] = useState(ticket.vote_count);
  const [isPending, startTransition] = useTransition();
  const isOwn = ticket.submitted_by === currentUserId;

  function handleVote(e) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleTicketVote(ticket.id, localVoted);
      if (!result?.error) {
        setLocalVoted(result.voted);
        setLocalCount(c => result.voted ? c + 1 : c - 1);
      }
    });
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-ink-800 last:border-0 hover:bg-ink-800/30 transition-colors">
      {/* Vote button */}
      <button
        onClick={handleVote}
        disabled={isPending || isOwn}
        title={isOwn ? "Can't vote on your own ticket" : localVoted ? "Remove vote" : "Upvote"}
        className={`flex flex-col items-center shrink-0 w-8 pt-0.5 transition-colors disabled:opacity-30 ${
          localVoted ? "text-brass-400" : "text-paper/25 hover:text-brass-400"
        }`}
      >
        <span className="text-xs">▲</span>
        <span className="text-[10px] font-mono">{localCount}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-paper/80 text-sm font-body truncate">{ticket.title}</p>
          <span className={`text-[10px] font-body shrink-0 ${STATUS_STYLES[ticket.status] || ""}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-paper/30 text-xs font-body line-clamp-1">{ticket.description}</p>
        <p className="text-paper/20 text-[10px] font-body mt-1">
          {ticket.profiles?.display_name} · {timeAgo(ticket.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function SupportTicketList({ tickets, votedIds, currentUserId }) {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 divide-y divide-ink-800">
      {tickets.map(ticket => (
        <TicketRow
          key={ticket.id}
          ticket={ticket}
          voted={votedIds.has(ticket.id)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
