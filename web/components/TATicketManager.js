"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatus } from "../lib/support-actions";

const TYPE_ICONS = { bug: "🐛", feature: "💡", data_issue: "📊", dataset_request: "📂" };
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "wont_fix", label: "Won't fix" },
  { value: "duplicate", label: "Duplicate" },
];

function TicketCard({ ticket, compact }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!compact);
  const [status, setStatus] = useState(ticket.status);
  const [notes, setNotes] = useState(ticket.ta_notes || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleUpdate() {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, status, notes);
      if (!result?.error) {
        setSaved(true);
        setTimeout(() => { setSaved(false); router.refresh(); }, 1500);
      }
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
            <span className="text-xs">{TYPE_ICONS[ticket.ticket_type]}</span>
            <span className="text-paper/80 text-sm font-body font-medium truncate">{ticket.title}</span>
            {ticket.vote_count > 0 && (
              <span className="text-[10px] font-body text-brass-400 shrink-0">▲ {ticket.vote_count}</span>
            )}
          </div>
          <p className="text-paper/40 text-xs font-body">
            {ticket.profiles?.display_name} · {new Date(ticket.created_at).toLocaleDateString()}
            {ticket.affected_ticker && ` · ${ticket.affected_ticker}`}
          </p>
        </div>
        <span className="text-paper/30 text-xs shrink-0">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="border-t border-ink-800 p-4 space-y-3">
          <p className="text-paper/70 text-sm font-body">{ticket.description}</p>
          {ticket.affected_page_url && (
            <p className="text-paper/30 text-xs font-body">Page: {ticket.affected_page_url}</p>
          )}

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="bg-ink-800 border border-ink-700 rounded-md text-xs font-body text-paper/70 px-2 py-1.5"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="TA notes (visible to member)…"
            rows={2}
            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/70 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
          />

          <button
            onClick={handleUpdate}
            disabled={isPending}
            className={`text-xs font-body rounded-md px-4 py-1.5 transition-colors disabled:opacity-40 ${
              saved ? "bg-gain text-ink-950" : "bg-brass-400 text-ink-950 hover:bg-brass-300"
            }`}
          >
            {saved ? "Saved!" : isPending ? "Saving…" : "Update"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TATicketManager({ tickets, assigneeId, compact = false }) {
  return (
    <div className="space-y-3">
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} compact={compact} />
      ))}
    </div>
  );
}
