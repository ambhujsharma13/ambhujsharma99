"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission, addReviewComment, resolveComment } from "../lib/review-actions";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_STYLES = {
  pending: "text-yellow-400 bg-yellow-400/10",
  approved: "text-gain bg-gain/10",
  changes_requested: "text-brass-400 bg-brass-400/10",
  rejected: "text-loss bg-loss/10",
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export default function ReviewQueueItem({ submission, comments = [], reviewerId, compact = false }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!compact);
  const [commentText, setCommentText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const article = submission.articles;
  const channel = submission.channels;
  const author = article?.profiles;

  function handleAction(status) {
    setError("");
    startTransition(async () => {
      const result = await reviewSubmission(submission.id, status, article?.id);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addReviewComment({
        articleId: article?.id,
        submissionId: submission.id,
        comment: commentText.trim(),
        selectedText: selectedText || null,
        commentType,
      });
      if (result?.error) setError(result.error);
      else { setCommentText(""); setSelectedText(""); router.refresh(); }
    });
  }

  function handleResolve(commentId) {
    startTransition(async () => {
      await resolveComment(commentId);
      router.refresh();
    });
  }

  const statusStyle = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${statusStyle}`}>
              {STATUS_LABELS[submission.status]}
            </span>
            <span className={`text-[10px] font-body px-1.5 py-0.5 rounded bg-ink-800 text-paper/50`}>
              {channel?.visibility === "public" ? "🌐" : "🔒"} {channel?.name}
            </span>
          </div>
          <p className="text-paper/90 text-sm font-body font-medium truncate">
            {article?.title || "Untitled"}
          </p>
          <p className="text-paper/40 text-xs font-body mt-0.5">
            by {author?.display_name || "Unknown"} · {timeAgo(submission.created_at)}
            {comments.length > 0 && ` · ${comments.length} comment${comments.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <span className="text-paper/30 text-xs shrink-0">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="border-t border-ink-800 p-4 space-y-4">
          {/* Article body preview */}
          <div className="bg-ink-950 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div
              className="text-paper/70 text-sm font-body prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article?.body || "<p>No content</p>" }}
            />
          </div>

          {/* Existing comments — track changes style */}
          {comments.length > 0 && (
            <div className="space-y-2">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-wide">
                Review comments ({comments.filter(c => !c.resolved_at).length} open)
              </p>
              {comments.map(c => (
                <div
                  key={c.id}
                  className={`border rounded-lg p-3 text-xs font-body ${
                    c.resolved_at
                      ? "border-ink-800 bg-ink-950 opacity-50"
                      : c.comment_type === "suggestion"
                      ? "border-brass-400/30 bg-brass-400/5"
                      : c.comment_type === "rejection_reason"
                      ? "border-loss/30 bg-loss/5"
                      : "border-ink-700 bg-ink-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-paper/60 font-medium">
                      {c.profiles?.display_name} ·{" "}
                      <span className="text-paper/30">{c.comment_type.replace("_", " ")}</span>
                    </span>
                    {!c.resolved_at && (
                      <button
                        onClick={() => handleResolve(c.id)}
                        className="text-paper/30 hover:text-gain transition-colors"
                      >
                        ✓ Resolve
                      </button>
                    )}
                  </div>
                  {c.selected_text && (
                    <blockquote className="border-l-2 border-brass-400/40 pl-2 text-paper/40 italic mb-1">
                      "{c.selected_text}"
                    </blockquote>
                  )}
                  <p className="text-paper/80">{c.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {submission.status === "pending" && (
            <div className="space-y-2">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-wide">Add comment</p>
              <div className="flex gap-2">
                <select
                  value={commentType}
                  onChange={e => setCommentType(e.target.value)}
                  className="bg-ink-800 border border-ink-700 rounded-md text-xs font-body text-paper/70 px-2 py-1.5"
                >
                  <option value="comment">Comment</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="rejection_reason">Rejection reason</option>
                </select>
              </div>
              <input
                type="text"
                value={selectedText}
                onChange={e => setSelectedText(e.target.value)}
                placeholder="Quote from article (optional)"
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-xs font-body text-paper/70 placeholder:text-paper/20 focus:outline-none focus:border-brass-400"
              />
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Your comment or suggested change…"
                rows={2}
                className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || isPending}
                className="text-xs font-body text-paper/60 border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors disabled:opacity-40"
              >
                Add comment
              </button>
            </div>
          )}

          {/* Actions */}
          {submission.status === "pending" && (
            <div className="flex items-center gap-2 pt-2 border-t border-ink-800">
              <button
                onClick={() => handleAction("approved")}
                disabled={isPending}
                className="text-ink-950 bg-gain text-xs font-body font-medium rounded-md px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Approve & publish to channel
              </button>
              <button
                onClick={() => handleAction("changes_requested")}
                disabled={isPending}
                className="text-brass-400 text-xs font-body border border-brass-400/40 rounded-md px-4 py-2 hover:bg-brass-400/10 transition-colors disabled:opacity-50"
              >
                Request changes
              </button>
              <button
                onClick={() => handleAction("rejected")}
                disabled={isPending}
                className="text-loss text-xs font-body border border-ink-700 rounded-md px-3 py-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {error && <p className="text-loss text-xs font-body">{error}</p>}
        </div>
      )}
    </div>
  );
}
