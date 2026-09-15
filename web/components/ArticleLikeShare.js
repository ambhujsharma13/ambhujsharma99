"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";

export default function ArticleLikeShare({ articleId, channelId, articleUrl, initialLikes = 0 }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: existing } = await supabase
        .from("article_likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("channel_id", channelId)
        .eq("user_id", data.user.id)
        .single();
      if (existing) setLiked(true);
      // Get total count
      const { count } = await supabase
        .from("article_likes")
        .select("id", { count: "exact", head: true })
        .eq("article_id", articleId)
        .eq("channel_id", channelId);
      setLikes(count || 0);
    });
  }, [articleId, channelId]);

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (liked) {
      await supabase.from("article_likes").delete()
        .eq("article_id", articleId).eq("channel_id", channelId).eq("user_id", user.id);
      setLiked(false);
      setLikes(l => Math.max(0, l - 1));
    } else {
      await supabase.from("article_likes").insert({ article_id: articleId, channel_id: channelId, user_id: user.id });
      setLiked(true);
      setLikes(l => l + 1);
    }
    setLoading(false);
  }

  function handleShare() {
    navigator.clipboard?.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-5 w-full">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-1.5 text-sm font-body transition-colors ${liked ? "text-rose-400" : "text-paper/40 hover:text-paper/70"}`}
      >
        {liked ? "♥" : "♡"}
        <span>{likes > 0 ? likes : "Like"}</span>
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-sm font-body text-paper/40 hover:text-paper/70 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); document.querySelector('[data-comment-box]')?.scrollIntoView({ behavior: 'smooth' }); }}
        className="flex items-center gap-1.5 text-sm font-body text-paper/40 hover:text-paper/70 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comment
      </a>
    </div>
  );
}
