"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContact } from "../lib/contact-actions";

export default function AddContactForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await addContact(identifier);
      if (result?.error) {
        setMessage(result.error);
      } else {
        setMessage(`Contact request sent to ${result.addedName} — they'll appear in your contacts once they accept.`);
        setIdentifier("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">Add a contact</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Username or email"
          className="flex-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-brass-400 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 disabled:opacity-50"
        >
          Send request
        </button>
      </div>
      {message && <p className="text-paper/60 text-xs font-body mt-2">{message}</p>}
    </form>
  );
}
