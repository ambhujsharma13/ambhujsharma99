"use client";

import { useState, useTransition } from "react";

// Generic reusable pin toggle button — takes an async action as a prop.
// Used for articles, watchlists, and DMs.
// The channel post pin button (PinButton in ChannelPosts.js) is separate
// since it's tightly coupled to the channel-post domain.
export default function InlinePinButton({ isPinned, onToggle, title = "Pin" }) {
  const [pinned, setPinned] = useState(isPinned);
  const [isPending, startTransition] = useTransition();

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await onToggle(pinned);
      if (!result?.error) setPinned(result.pinned);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={pinned ? `Unpin` : title}
      className={`transition-colors disabled:opacity-40 ${
        pinned ? "text-brass-400 hover:text-paper/50" : "text-paper/20 hover:text-brass-400"
      }`}
    >
      <svg viewBox="0 0 20 20" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3l1.5 4H5l3 4v4l2-2 2 2v-4l3-4h-3.5L13 3H7z" />
      </svg>
    </button>
  );
}
