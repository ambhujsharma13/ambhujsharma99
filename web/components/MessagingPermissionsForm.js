"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMessagingPermissions } from "../lib/messaging-settings-actions";

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        checked ? "bg-brass-400" : "bg-ink-700"
      }`}
    >
      {/* left-0.5 is the explicit resting (unchecked) position — the
          earlier version had no base "left" at all and relied purely on
          translate-x, which pushed the thumb past the pill's right edge
          entirely once checked (confirmed via zoomed-in live testing:
          the white circle was visibly overflowing outside the colored
          background). translate-x-5 now moves it exactly one thumb-
          width (20px) to the right of that explicit base, landing it
          flush against the right edge with the same 2px inset the left
          side already has. */}
      <span
        className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-paper transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function MessagingPermissionsForm({ profile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [allowFromContacts, setAllowFromContacts] = useState(profile.allow_messages_from_contacts ?? true);
  const [allowFromAnyone, setAllowFromAnyone] = useState(profile.allow_messages_from_anyone ?? false);
  const [filterUnknownSenders, setFilterUnknownSenders] = useState(profile.filter_unknown_senders ?? false);

  function save(next) {
    startTransition(async () => {
      await updateMessagingPermissions(next);
      router.refresh();
    });
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 space-y-4">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide">Messaging permissions</p>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-paper/90 text-sm font-body">Allow messages from my contacts</p>
          <p className="text-paper/30 text-xs font-body">
            Requires a mutual contact relationship — you've both added each other
          </p>
        </div>
        <Toggle
          checked={allowFromContacts}
          disabled={isPending}
          onChange={(v) => {
            setAllowFromContacts(v);
            save({ allowFromContacts: v, allowFromAnyone, filterUnknownSenders });
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-paper/90 text-sm font-body">Allow messages from anyone</p>
          <p className="text-paper/30 text-xs font-body">Skips the contacts check entirely — opt-in, off by default</p>
        </div>
        <Toggle
          checked={allowFromAnyone}
          disabled={isPending}
          onChange={(v) => {
            setAllowFromAnyone(v);
            save({ allowFromContacts, allowFromAnyone: v, filterUnknownSenders });
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-paper/90 text-sm font-body">Filter messages from people I may not know</p>
          <p className="text-paper/30 text-xs font-body">
            Routes messages from non-contacts into a separate holding area, rather than the main inbox
          </p>
        </div>
        <Toggle
          checked={filterUnknownSenders}
          disabled={isPending}
          onChange={(v) => {
            setFilterUnknownSenders(v);
            save({ allowFromContacts, allowFromAnyone, filterUnknownSenders: v });
          }}
        />
      </div>
    </div>
  );
}
