"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDirectMessage } from "../lib/message-actions";

export default function MessageComposer({ recipientId }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendDirectMessage(recipientId, content);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-ink-800 pt-3">
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a newline — the standard
            // chat-app convention, since this is a message composer,
            // not a long-form text field.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Write a message..."
          rows={2}
          className="flex-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400 placeholder:text-paper/30 resize-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50 shrink-0"
        >
          Send
        </button>
      </div>
      {error && <p className="text-loss text-xs font-body mt-2">{error}</p>}
    </form>
  );
}
