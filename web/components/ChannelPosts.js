"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, createReply, togglePostPin, flagPost, toggleLike } from "../lib/channel-actions";

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

function ReplyForm({ channelId, parentPostId, onDone }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createReply(channelId, parentPostId, content);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        router.refresh();
        onDone?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30 resize-none mb-1"
      />
      <div className="flex items-center justify-between">
        {error && <p className="text-loss text-xs font-body">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto text-brass-400 text-xs font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 disabled:opacity-50"
        >
          Reply
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

// Deliberately an inline expandable form rather than a native
// window.prompt() — consistent with avoiding native browser dialogs
// elsewhere in this project (confirm() specifically caused real
// friction with automated testing earlier), and it's a nicer, more
// visually consistent experience regardless.
function FlagButton({ postId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    startTransition(async () => {
      const result = await flagPost(postId, reason);
      if (result?.error) {
        setMessage(result.error);
      } else {
        setMessage("Flagged for review.");
        setReason("");
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-paper/25 text-xs font-body hover:text-paper/50">
        Flag
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        className="bg-ink-800 border border-ink-700 rounded px-2 py-1 text-xs font-body text-paper w-40 focus:outline-none focus:border-brass-400"
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-brass-400 text-xs font-body hover:underline disabled:opacity-50"
      >
        Submit
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-paper/30 text-xs font-body hover:text-paper/50"
      >
        Cancel
      </button>
      {message && <span className="text-paper/40 text-xs font-body">{message}</span>}
    </form>
  );
}

function PinButton({ postId, channelId, isPinned }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await togglePostPin(postId, channelId, !isPinned);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-paper/25 text-xs font-body hover:text-paper/50 disabled:opacity-50"
    >
      {isPinned ? "Unpin" : "Pin"}
    </button>
  );
}

function LikeButton({ postId, channelId, likeCount, likedByMe }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleLike(postId, channelId, !likedByMe);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-body disabled:opacity-50 ${
        likedByMe ? "text-brass-400" : "text-paper/25 hover:text-paper/50"
      }`}
    >
      {likedByMe ? "♥" : "♡"} {likeCount > 0 ? likeCount : "Like"}
    </button>
  );
}

// Copies a direct link to this specific post — client-side only, no
// backend needed, since it just points back to the same channel page
// with an anchor. Posts don't have their own dedicated page/URL beyond
// that, which is the simplest meaningful version of "share" for a
// channel discussion post (as opposed to a full article or report).
function ShareButton({ postId }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button onClick={handleClick} className="text-paper/25 text-xs font-body hover:text-paper/50">
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}

function ReplyItem({ reply, channelId }) {
  return (
    <div id={`post-${reply.id}`} className="pl-4 border-l-2 border-ink-800 py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-paper/80 text-sm font-body font-medium">{reply.profiles?.display_name || "Member"}</span>
        <span className="text-paper/30 text-xs font-body">{timeAgo(reply.created_at)}</span>
      </div>
      <p className="text-paper/80 font-body text-sm whitespace-pre-wrap mb-1">{reply.content}</p>
      <div className="flex items-center gap-3">
        <LikeButton postId={reply.id} channelId={channelId} likeCount={reply.likeCount} likedByMe={reply.likedByMe} />
        <ShareButton postId={reply.id} />
        <FlagButton postId={reply.id} />
      </div>
    </div>
  );
}

function PostItem({ post, channelId, isChannelAdmin }) {
  const [threadOpen, setThreadOpen] = useState(false);
  const replyCount = post.replies?.length || 0;

  return (
    <div id={`post-${post.id}`} className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        {post.is_pinned && (
          <span className="text-brass-400 text-[11px] font-body uppercase tracking-wide">📌 Pinned</span>
        )}
        <span className="text-paper/80 text-sm font-body font-medium">{post.profiles?.display_name || "Member"}</span>
        <span className="text-paper/30 text-xs font-body">{timeAgo(post.created_at)}</span>
      </div>
      <p className="text-paper/80 font-body text-sm whitespace-pre-wrap mb-2">{post.content}</p>
      <div className="flex items-center gap-3 mb-1">
        <LikeButton postId={post.id} channelId={channelId} likeCount={post.likeCount} likedByMe={post.likedByMe} />
        <ShareButton postId={post.id} />
        {isChannelAdmin && <PinButton postId={post.id} channelId={channelId} isPinned={post.is_pinned} />}
        <FlagButton postId={post.id} />
        <button
          onClick={() => setThreadOpen((o) => !o)}
          className="text-paper/40 text-xs font-body hover:text-paper/70"
        >
          {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Reply"}
        </button>
      </div>
      {threadOpen && (
        <div className="mt-3 pt-3 border-t border-ink-800">
          {post.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} channelId={channelId} />
          ))}
          <ReplyForm channelId={channelId} parentPostId={post.id} />
        </div>
      )}
    </div>
  );
}

// A likes-only adaptation of Reddit's "hot" algorithm — no downvotes,
// per the earlier explicit decision that downvotes get used to punish
// disagreement rather than genuine low quality. Log-scaled like count
// (so 100 likes isn't 10x "hotter" than 10, just moderately more) minus
// a time-decay term, so an older post needs meaningfully more
// engagement than a fresh one to stay competitive in the ranking.
const HOT_DECAY_HOURS = 12; // a post loses roughly one "log-point" of standing every 12 hours
function hotScore(post) {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  return Math.log10((post.likeCount || 0) + 1) - ageHours / HOT_DECAY_HOURS;
}

function sortPosts(posts, mode) {
  const pinned = posts.filter((p) => p.is_pinned);
  const unpinned = posts.filter((p) => !p.is_pinned);
  const sorted =
    mode === "hot"
      ? [...unpinned].sort((a, b) => hotScore(b) - hotScore(a))
      : [...unpinned].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return [...pinned, ...sorted];
}

export default function ChannelPosts({ channelId, posts, isChannelAdmin = false }) {
  const [sortMode, setSortMode] = useState("newest");
  const sortedPosts = sortPosts(posts, sortMode);

  return (
    <div>
      <PostForm channelId={channelId} />

      {posts.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {[
            { key: "newest", label: "Newest" },
            { key: "hot", label: "Hot" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={`text-xs font-body px-2.5 py-1 rounded-md transition-colors ${
                sortMode === opt.key ? "bg-ink-800 text-brass-400" : "text-paper/40 hover:text-paper/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">No posts yet — be the first to write something.</p>
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <PostItem key={post.id} post={post} channelId={channelId} isChannelAdmin={isChannelAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
