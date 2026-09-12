"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDirectMessage } from "../lib/message-actions";
import AttachmentComposer from "./AttachmentComposer";

export default function MessageComposer({ recipientId }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendDirectMessage(recipientId, content, attachment);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        setAttachment(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="border-t border-ink-800 pt-2">
      <div className="border border-ink-700 rounded-lg bg-ink-900 px-3 pt-2 pb-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="w-full bg-transparent text-paper text-sm font-body focus:outline-none placeholder:text-paper/30 resize-none"
          style={{ minHeight: "1.5rem", maxHeight: "8rem", overflowY: "auto" }}
          onInput={(e) => {
            // Auto-expand up to 8 lines
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />
        <div className="flex items-center justify-between pt-1.5 border-t border-ink-800 mt-1">
          <AttachmentComposer
            attachment={attachment}
            onAttach={setAttachment}
            onClear={() => setAttachment(null)}
            disabled={isPending}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || (!content.trim() && !attachment)}
            className="text-ink-950 bg-brass-400 text-xs font-body font-medium rounded-md px-3 py-1.5 hover:bg-brass-300 transition-colors disabled:opacity-40 shrink-0 ml-2"
          >
            Send
          </button>
        </div>
      </div>
      {error && <p className="text-loss text-xs font-body mt-1.5">{error}</p>}
    </div>
  );
}
