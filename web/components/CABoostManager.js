"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantOmegaBoost, revokeOmegaBoost } from "../lib/ca-actions";
import RoleBadge from "./RoleBadge";

export default function CABoostManager({ members, myBoosts, boostedMemberIds, maxBoosts, currentUserId }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const canGrant = myBoosts.length < maxBoosts;

  function handleGrant() {
    if (!selectedId) { setError("Select a member to boost."); return; }
    if (boostedMemberIds.includes(selectedId)) { setError("This member already has a community boost."); return; }
    setError("");
    startTransition(async () => {
      const result = await grantOmegaBoost(selectedId, reason);
      if (result?.error) { setError(result.error); }
      else { setSelectedId(""); setReason(""); router.refresh(); }
    });
  }

  function handleRevoke(recipientId) {
    startTransition(async () => {
      const result = await revokeOmegaBoost(recipientId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Active boosts */}
      {myBoosts.length > 0 && (
        <div className="space-y-2">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide">Your active boosts</p>
          {myBoosts.map(b => (
            <div key={b.id} className="flex items-center justify-between gap-3 bg-ink-800 rounded-lg px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-paper/80 text-sm font-body">{b.profiles?.display_name}</span>
                  <span className="text-brass-400 text-[10px] font-mono">Ω +5</span>
                </div>
                {b.reason && (
                  <p className="text-paper/30 text-xs font-body mt-0.5 truncate">"{b.reason}"</p>
                )}
              </div>
              <button
                onClick={() => handleRevoke(b.recipient_id)}
                disabled={isPending}
                className="text-loss text-xs font-body hover:text-loss/70 transition-colors disabled:opacity-40 shrink-0"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Grant form */}
      {canGrant ? (
        <div className="space-y-2">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-wide">
            Grant a boost ({maxBoosts - myBoosts.length} remaining)
          </p>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/70 focus:outline-none focus:border-brass-400"
          >
            <option value="">Select a member…</option>
            {members.filter(m => !boostedMemberIds.includes(m.id)).map(m => (
              <option key={m.id} value={m.id}>
                {m.display_name} {m.omega_score ? `(Ω ${m.omega_score})` : ""}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason (optional — shown on their profile)"
            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/70 placeholder:text-paper/20 focus:outline-none focus:border-brass-400"
          />

          {error && <p className="text-loss text-xs font-body">{error}</p>}

          <button
            onClick={handleGrant}
            disabled={!selectedId || isPending}
            className="w-full bg-brass-400 text-ink-950 text-sm font-body font-medium rounded-md py-2 hover:bg-brass-300 transition-colors disabled:opacity-40"
          >
            {isPending ? "Granting…" : "Grant +5 Omega boost"}
          </button>
        </div>
      ) : (
        <div className="bg-ink-800 rounded-lg p-3 text-center">
          <p className="text-paper/40 text-xs font-body">
            You've used all {maxBoosts} boosts. Revoke one above to grant another.
          </p>
        </div>
      )}
    </div>
  );
}
