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

export default function PublicChannelSearch() {
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

      // Search published articles in public channels — title, body, and tags
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name), article_channels!inner(channel_id, channels(id, name, visibility))")
        .ilike("title", `%${q}%`)
        .eq("status", "published")
        .limit(8);

      // Search article bodies
      const { data: byBody } = await supabase
        .from("articles")
        .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name), article_channels!inner(channel_id, channels(id, name, visibility))")
        .ilike("body", `%${q}%`)
        .eq("status", "published")
        .limit(6);

      // Search discussion posts in public channels
      const { data: posts } = await supabase
        .from("discussion_posts")
        .select("id, content, created_at, channel_id, profiles!discussion_posts_user_id_fkey(display_name), channels!inner(id, name, visibility)")
        .eq("channels.visibility", "public")
        .ilike("content", `%${q}%`)
        .limit(6);

      // Also search by tags
      const { data: byTags } = await supabase
        .from("articles")
        .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name), article_channels!inner(channel_id, channels(id, name, visibility))")
        .contains("tags", [q.toLowerCase()])
        .eq("status", "published")
        .limit(4);

      // Merge and deduplicate articles
      const allArticles = [...(articles || []), ...(byBody || []), ...(byTags || [])];
      const seen = new Set();
      const dedupedArticles = allArticles
        .filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return a.article_channels?.some(ac => ac.channels?.visibility === "public");
        });

      setResults({ articles: dedupedArticles.slice(0, 8), posts: posts || [] });
      setLoading(false);
    }, 350);
  }, [query]);

  const hasResults = results && (results.articles?.length > 0 || results.posts?.length > 0);
  const noResults = results && !hasResults && !loading;

  return (
    <div className="border border-ink-700 rounded-xl bg-ink-900/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-800">
        <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest">Search Public Channel Content</p>
        <p className="text-paper/25 text-[10px] font-body mt-0.5">Articles and posts across all public channels</p>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 focus-within:border-brass-400/50 transition-colors">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-paper/30 shrink-0">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path strokeLinecap="round" d="M15 15l-3-3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles, posts, topics…"
            className="flex-1 bg-transparent text-xs font-body text-paper/80 placeholder:text-paper/20 focus:outline-none"
          />
          {loading && <span className="text-paper/25 text-[10px]">…</span>}
          {query && !loading && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="text-paper/20 hover:text-paper/50 text-xs">✕</button>
          )}
        </div>

        {(hasResults || noResults) && query.length >= 2 && (
          <div className="mt-2 border border-ink-700 rounded-lg bg-ink-900 overflow-hidden divide-y divide-ink-800 max-h-80 overflow-y-auto">
            {noResults && (
              <p className="px-3 py-2.5 text-paper/30 text-xs font-body">No results for "{query}"</p>
            )}
            {results.articles?.map(a => {
              const ch = a.article_channels?.[0];
              const channelId = ch?.channel_id;
              return (
                <Link key={a.id}
                  href={channelId ? `/member/channels/${channelId}/articles/${a.id}` : `/member/publish?id=${a.id}&view=1`}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-ink-800/60 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-paper/80 text-xs font-body font-medium group-hover:text-brass-400 transition-colors line-clamp-1">{a.title}</p>
                    <p className="text-paper/25 text-[10px] font-body mt-0.5">
                      {a.profiles?.display_name} · 🌐 {ch?.channels?.name}
                    </p>
                  </div>
                  <span className="text-[9px] text-paper/20 font-body shrink-0">Article</span>
                </Link>
              );
            })}
            {results.posts?.map(p => (
              <Link key={p.id} href={`/member/channels/${p.channel_id}`}
                className="flex items-start gap-2 px-3 py-2.5 hover:bg-ink-800/60 transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="text-paper/70 text-xs font-body group-hover:text-paper/90 line-clamp-1">{p.content}</p>
                  <p className="text-paper/25 text-[10px] font-body mt-0.5">
                    {p.profiles?.display_name} · 🌐 {p.channels?.name} · {timeAgo(p.created_at)}
                  </p>
                </div>
                <span className="text-[9px] text-paper/20 font-body shrink-0">Post</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
