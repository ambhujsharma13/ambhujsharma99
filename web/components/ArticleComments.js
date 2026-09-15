"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function ArticleComments({ articleId, channelId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadComments(supabase);
  }, [articleId]);

  async function loadComments(supabase) {
    if (!supabase) supabase = createClient();
    const { data } = await supabase
      .from("article_comments")
      .select("id, content, created_at, user_id, profiles!article_comments_user_id_fkey(display_name, admin_role, omega_score, avatar_url)")
      .eq("article_id", articleId)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("article_comments").insert({
      article_id: articleId,
      channel_id: channelId,
      user_id: currentUser?.id,
      content: trimmed,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setText("");
      await loadComments(supabase);
    }
    setSending(false);
  }

  const ROLE_COLORS = {
    research: "bg-green-500/20 text-green-400 border-green-500/30",
    super_admin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    technical: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    community: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  const ROLE_LABELS = { research: "RA", super_admin: "SA", technical: "TA", community: "CA" };

  return (
    <div className="mt-10 pt-8 border-t border-ink-800" data-comment-box>
      <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-4">
        Comments · {comments.length}
      </p>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4 mb-6">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-ink-700 overflow-hidden shrink-0">
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-paper/40 text-xs font-display">
                      {c.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                }
              </div>
              <div className="min-w-0 flex-1 bg-ink-900 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-paper/80 text-xs font-body font-medium">{c.profiles?.display_name}</span>
                  {c.profiles?.admin_role && ROLE_LABELS[c.profiles.admin_role] && (
                    <span className={`text-[9px] font-body px-1 py-0.5 rounded border ${ROLE_COLORS[c.profiles.admin_role] || ""}`}>
                      {ROLE_LABELS[c.profiles.admin_role]}
                    </span>
                  )}
                  {c.profiles?.omega_score > 0 && (
                    <span className="text-[10px] font-mono text-paper/25">Ω {c.profiles.omega_score}</span>
                  )}
                  <span className="text-paper/25 text-[10px] font-body ml-auto">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-paper/70 text-sm font-body leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a comment */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-ink-700 shrink-0 flex items-center justify-center text-paper/30 text-xs font-display">
          {user?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-paper/20 text-[10px] font-body">Cmd+Enter to post</span>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || sending}
              className="text-xs font-body text-ink-950 bg-brass-400 px-3 py-1.5 rounded-md hover:bg-brass-300 transition-colors disabled:opacity-40"
            >
              {sending ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && <p className="text-loss text-xs font-body mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
