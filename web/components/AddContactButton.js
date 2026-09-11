"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContactById, removeContact } from "../lib/contact-actions";

// Three states now, not two, since adding is a request rather than an
// immediate action: not yet added, a request already sent and awaiting
// their acceptance, or already an accepted (mutual) contact.
export default function AddContactButton({ contactId, initiallyAdded, initiallyPending }) {
  const router = useRouter();
  const [added, setAdded] = useState(initiallyAdded);
  const [pending, setPending] = useState(initiallyPending);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      if (added) {
        await removeContact(contactId);
        setAdded(false);
      } else if (!pending) {
        const result = await addContactById(contactId);
        if (result?.error) {
          setError(result.error);
        } else {
          setPending(true);
        }
      }
      router.refresh();
    });
  }

  const label = added ? "Added" : pending ? "Request sent" : "Add to Contacts";
  const clickable = !pending; // a pending request has nothing left to click until the other person responds

  return (
    <div className="shrink-0 text-right">
      <button
        onClick={clickable ? handleClick : undefined}
        disabled={isPending || !clickable}
        className={`text-sm font-body rounded-md px-4 py-2 transition-colors disabled:opacity-50 ${
          added || pending
            ? "text-paper/60 border border-ink-700 hover:bg-ink-800"
            : "text-ink-950 bg-brass-400 hover:bg-brass-300 font-medium"
        }`}
      >
        {label}
      </button>
      {error && <p className="text-loss text-xs font-body mt-1">{error}</p>}
    </div>
  );
}
