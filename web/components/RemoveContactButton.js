"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeContact } from "../lib/contact-actions";

export default function RemoveContactButton({ contactId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await removeContact(contactId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-paper/30 text-xs font-body hover:text-loss disabled:opacity-50 shrink-0"
    >
      Remove
    </button>
  );
}
