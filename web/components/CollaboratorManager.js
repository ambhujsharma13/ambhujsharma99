"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCollaborator, removeCollaborator } from "../lib/article-actions";

export default function CollaboratorManager({ articleId, collaborators }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await addCollaborator(articleId, identifier);
      if (result?.error) {
        setMessage(result.error);
      } else {
        setMessage(`Invite sent to ${result.addedName} — they'll appear once accepted.`);
        setIdentifier("");
        router.refresh();
      }
    });
  }

  function handleRemove(userId) {
    startTransition(async () => {
      await removeCollaborator(articleId, userId);
      router.refresh();
    });
  }

  // Shown for a brand-new, not-yet-saved article too, per explicit
  // request — rather than hiding the whole box until a save happens
  // (which made collaborators feel like an afterthought bolted on
  // after the fact), it's always visible, just gated on having an
  // actual id to attach collaborator rows to underneath.
  if (!articleId) {
    return (
      <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
        <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Collaborators</p>
        <p className="text-paper/30 text-xs font-body">Save this article as a draft first to add collaborators.</p>
      </div>
    );
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Collaborators</p>
      {collaborators.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {collaborators.map((c) => (
            <div key={c.user_id} className="flex items-center justify-between text-sm font-body">
              <span className="text-paper/80">{c.profiles?.display_name || c.profiles?.email || "Member"}</span>
              <button
                onClick={() => handleRemove(c.user_id)}
                disabled={isPending}
                className="text-paper/30 text-xs hover:text-loss disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-paper/30 text-xs font-body mb-3">
          No collaborators yet — add someone to let them edit this article too.
        </p>
      )}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Username or email"
          className="flex-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-1.5 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-brass-400 text-sm font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {message && <p className="text-paper/40 text-xs font-body mt-2">{message}</p>}
    </div>
  );
}
