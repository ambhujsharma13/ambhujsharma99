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

export default function PrivateChannelSearch({ channelIds = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const q = query.trim();

      if (channelIds.length === 0) {
        setResults({ articles: [], posts: [] });
        setLoading(false);
        return;
      }

      // Search articles published in MY private channels — join via article_channels
      // channelIds are already the user's private channels, no visibility filter needed
      const { data: articleLinks } = await supabase
        .from("article_channels")
        .select("channel_id, article_id, channels(id, name, visibility)")
        .in("channel_id", channelIds);

      const articleIds = (articleLinks || []).map(l => l.article_id);
      const channelByArticle = {};
      for (const l of articleLinks || []) {
        channelByArticle[l.article_id] = l;
      }

      let matchingArticles = [];
      if (articleIds.length > 0) {
        // Search title, body content (HTML — ilike still finds text within tags), and tags
        const { data: byTitle } = await supabase
          .from("articles")
          .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name)")
          .in("id", articleIds)
          .ilike("title", `%${q}%`);

        const { data: byBody } = await supabase
          .from("articles")
          .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name)")
          .in("id", articleIds)
          .ilike("body", `%${q}%`);

        const { data: byTags } = await supabase
          .from("articles")
          .select("id, title, tags, published_at, profiles!articles_user_id_fkey(display_name)")
          .in("id", articleIds)
          .contains("tags", [q.toLowerCase()]);

        // Merge and deduplicate
        const seen = new Set();
        const merged = [...(byTitle || []), ...(byBody || []), ...(byTags || [])].filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });

        matchingArticles = merged.map(a => ({
          ...a,
          channelLink: channelByArticle[a.id]
        }));
      }

      // Search discussion posts in my private channels
      const { data: posts } = await supabase
        .from("discussion_posts")
        .select("id, content, created_at, channel_id, profiles!discussion_posts_user_id_fkey(display_name), channels(name)")
        .in("channel_id", channelIds)
        .ilike("content", `%${q}%`)
        .limit(6);

      setResults({ articles: matchingArticles.slice(0, 6), posts: posts || [] });
      setLoading(false);
    }, 350);
  }, [query, channelIds]);

  const hasResults = results && (results.articles?.length > 0 || results.posts?.length > 0);
  const noResults = results && !hasResults && !loading;

  return (
    <div className="mb-8">
      <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Search Your Private Channels</p>
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
            placeholder="Search articles and posts across all your private channels…"
            className="flex-1 bg-transparent text-sm font-body text-paper/80 placeholder:text-paper/25 focus:outline-none"
          />
          {loading && <span className="text-paper/30 text-xs font-body">Searching…</span>}
          {query && !loading && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="text-paper/25 hover:text-paper/60 transition-colors text-xs">✕</button>
          )}
        </div>

        {/* Results */}
        {(hasResults || noResults) && query.length >= 2 && (
          <div className="mt-2 border border-ink-700 rounded-xl bg-ink-900/95 overflow-hidden divide-y divide-ink-800">
            {noResults && (
              <p className="px-4 py-3 text-paper/30 text-sm font-body">No results for "{query}" in your private channels.</p>
            )}

            {results.articles?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-paper/25 text-[10px] font-body uppercase tracking-widest bg-ink-950/50">Articles · {results.articles.length}</p>
                {results.articles.map(a => {
                  const ch = a.channelLink;
                  const channelId = ch?.channel_id;
                  return (
                    <Link key={a.id}
                      href={channelId ? `/member/channels/${channelId}/articles/${a.id}` : `/member/publish?id=${a.id}&view=1`}
                      className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-ink-800/60 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-paper/80 text-sm font-body font-medium group-hover:text-brass-400 transition-colors truncate">{a.title}</p>
                        <p className="text-paper/30 text-[10px] font-body mt-0.5">
                          {a.profiles?.display_name} · 🔒 {ch?.channels?.name}
                        </p>
                      </div>
                      <span className="text-[9px] font-body text-paper/20 shrink-0 mt-1">Article</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {results.posts?.length > 0 && (
              <div>
                <p className="px-4 py-2 text-paper/25 text-[10px] font-body uppercase tracking-widest bg-ink-950/50">Posts · {results.posts.length}</p>
                {results.posts.map(p => (
                  <Link key={p.id} href={`/member/channels/${p.channel_id}`}
                    className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-ink-800/60 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-paper/70 text-sm font-body group-hover:text-paper/90 transition-colors line-clamp-2">{p.content}</p>
                      <p className="text-paper/30 text-[10px] font-body mt-0.5">
                        {p.profiles?.display_name} · 🔒 {p.channels?.name} · {timeAgo(p.created_at)}
                      </p>
                    </div>
                    <span className="text-[9px] font-body text-paper/20 shrink-0 mt-1">Post</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
