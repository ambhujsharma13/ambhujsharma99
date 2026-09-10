"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "../lib/channel-actions";

function PostForm({ channelId }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createPost(channelId, content);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post something to this channel..."
        rows={3}
        className="w-full bg-transparent text-paper text-sm font-body focus:outline-none placeholder:text-paper/30 resize-none mb-2"
      />
      <div className="flex items-center justify-between">
        {error && <p className="text-loss text-xs font-body">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </form>
  );
}

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

export default function ChannelPosts({ channelId, posts }) {
  return (
    <div>
      <PostForm channelId={channelId} />

      {posts.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">No posts yet — be the first to write something.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="border border-ink-700 rounded-lg bg-ink-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                {post.is_pinned && (
                  <span className="text-brass-400 text-[11px] font-body uppercase tracking-wide">📌 Pinned</span>
                )}
                <span className="text-paper/80 text-sm font-body font-medium">
                  {post.profiles?.display_name || "Member"}
                </span>
                <span className="text-paper/30 text-xs font-body">{timeAgo(post.created_at)}</span>
              </div>
              <p className="text-paper/80 font-body text-sm whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
