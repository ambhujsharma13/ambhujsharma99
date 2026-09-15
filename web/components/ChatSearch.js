"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatSearch({ userId, contactIds = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setResults(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = query.trim();

      // Search direct messages where I am sender or recipient
      const { data: sent } = await supabase
        .from("direct_messages")
        .select("id, content, created_at, recipient_id, profiles!direct_messages_recipient_id_fkey(id, display_name, avatar_url)")
        .eq("sender_id", userId)
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8);

      const { data: received } = await supabase
        .from("direct_messages")
        .select("id, content, created_at, sender_id, profiles!direct_messages_sender_id_fkey(id, display_name, avatar_url)")
        .eq("recipient_id", userId)
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8);

      // Merge, deduplicate, sort by date
      const all = [
        ...(sent || []).map(m => ({
          ...m,
          otherUserId: m.recipient_id,
          otherUser: m.profiles,
          direction: "sent"
        })),
        ...(received || []).map(m => ({
          ...m,
          otherUserId: m.sender_id,
          otherUser: m.profiles,
          direction: "received"
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

      setResults(all);
      setLoading(false);
    }, 350);
  }, [query, userId]);

  const hasResults = results && results.length > 0;
  const noResults = results && !hasResults && !loading;

  return (
    <div className="mb-8">
      <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Search Your Conversations</p>
      <div className="relative">
        <div className="flex items-center gap-2 bg-ink-900 border border-ink-700 rounded-xl px-4 py-3 focus-within:border-brass-400/50 transition-colors">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-paper/30 shrink-0">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path strokeLinecap="round" d="M15 15l-3-3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages across all your conversations…"
            className="flex-1 bg-transparent text-sm font-body text-paper/80 placeholder:text-paper/25 focus:outline-none"
          />
          {loading && <span className="text-paper/30 text-xs font-body">Searching…</span>}
          {query && !loading && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="text-paper/25 hover:text-paper/60 transition-colors text-xs">✕</button>
          )}
        </div>

        {(hasResults || noResults) && query.length >= 2 && (
          <div className="mt-2 border border-ink-700 rounded-xl bg-ink-900/95 overflow-hidden divide-y divide-ink-800 max-h-96 overflow-y-auto">
            {noResults && (
              <p className="px-4 py-3 text-paper/30 text-sm font-body">No messages found for "{query}".</p>
            )}
            {(results || []).map(msg => (
              <Link key={msg.id}
                href={`/member/inbox/${msg.otherUserId}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-ink-800/60 transition-colors group">
                <div className="w-7 h-7 rounded-full bg-ink-700 flex items-center justify-center text-paper/40 text-xs font-display shrink-0 mt-0.5">
                  {msg.otherUser?.display_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-paper/70 text-xs font-body font-medium">{msg.otherUser?.display_name}</span>
                    <span className="text-paper/25 text-[10px] font-body">{msg.direction === "sent" ? "You →" : "→ You"}</span>
                    <span className="text-paper/20 text-[10px] font-body ml-auto">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-paper/60 text-xs font-body line-clamp-2">{msg.content}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
