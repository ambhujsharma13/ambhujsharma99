"use client";

import { useState, useTransition } from "react";
import { toggleBookmark } from "../lib/bookmark-actions";

// Reusable inline bookmark toggle — renders as a small icon button.
// Used on article cards and channel posts. Takes either articleId or
// postId (not both) and the current bookmarked state to show the
// correct icon immediately without a round-trip.
export default function BookmarkButton({ articleId, postId, initiallyBookmarked = false }) {
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [isPending, startTransition] = useTransition();

  const contentType = articleId ? "article" : "discussion_post";

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleBookmark({ contentType, articleId, postId });
      if (!result?.error) {
        setBookmarked(result.bookmarked);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={bookmarked ? "Remove bookmark" : "Bookmark"}
      className={`transition-colors disabled:opacity-40 ${
        bookmarked
          ? "text-brass-400 hover:text-paper/50"
          : "text-paper/25 hover:text-brass-400"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3h10a1 1 0 011 1v13l-6-3.5L4 17V4a1 1 0 011-1z"
        />
      </svg>
    </button>
  );
}
