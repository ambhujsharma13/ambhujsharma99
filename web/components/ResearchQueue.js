"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CATEGORY_LABELS = {
  general: "General", company: "Company/Stock", sector: "Sector/Industry",
  macro: "Macro/Economy", commodity: "Commodity", policy: "Policy/Regulation", technology: "Technology",
};

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  follow_up_requested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  answered: "bg-green-500/10 text-green-400 border-green-500/20",
  denied: "bg-ink-700 text-paper/30 border-ink-600",
};

const STATUS_LABELS = {
  pending: "⏳ Pending", accepted: "✋ Accepted", in_progress: "🔬 In Progress",
  follow_up_requested: "↩ Follow-up sent", answered: "✓ Answered", denied: "✕ Denied",
};

function RequestCard({ req, currentUserId, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState(null); // 'respond' | 'followup' | 'deny'
  const [responseText, setResponseText] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isAcceptedByMe = req.accepted_by === currentUserId;
  const isAcceptedByOther = req.accepted_by && req.accepted_by !== currentUserId;
  const canAct = req.status === "pending" || (req.status === "accepted" && isAcceptedByMe) || (req.status === "in_progress" && isAcceptedByMe);

  async function handle(action) {
    setSaving(true); setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setSaving(false); return; }

    let updateData = {};

    if (action === "accept") {
      updateData = { status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() };
    } else if (action === "respond") {
      if (!responseText.trim()) { setError("Response cannot be empty"); setSaving(false); return; }
      updateData = { status: "answered", response: responseText.trim(), answered_by: user.id, answered_at: new Date().toISOString() };
    } else if (action === "followup") {
      if (!followUpText.trim()) { setError("Follow-up question cannot be empty"); setSaving(false); return; }
      updateData = { status: "follow_up_requested", follow_up_question: followUpText.trim() };
    } else if (action === "deny") {
      if (!denialReason.trim()) { setError("Please provide a reason for denial"); setSaving(false); return; }
      updateData = { status: "denied", denial_reason: denialReason.trim() };
    }

    const { error: err } = await supabase
      .from("human_intel_requests")
      .update(updateData)
      .eq("id", req.id);

    if (err) { setError(err.message); } else { setMode(null); onUpdate(); }
    setSaving(false);
  }

  return (
    <div className={`border rounded-xl bg-ink-900/60 overflow-hidden ${isAcceptedByOther ? "opacity-50" : "border-ink-700"}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[9px] font-body px-1.5 py-0.5 rounded border ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
              {STATUS_LABELS[req.status] || req.status}
            </span>
            {req.category && req.category !== "general" && (
              <span className="text-[9px] font-body text-paper/30 bg-ink-800 px-1.5 py-0.5 rounded">{CATEGORY_LABELS[req.category]}</span>
            )}
            {isAcceptedByOther && <span className="text-[9px] text-paper/25 font-body">Claimed by another CA</span>}
          </div>
          <p className="text-paper/80 text-sm font-body font-medium leading-snug line-clamp-2">{req.question}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-paper/30 text-[10px] font-body">{req.profiles?.display_name || "Member"}</span>
            <span className="text-paper/20 text-[10px] font-body">{timeAgo(req.created_at)}</span>
            {req.accepted_by && req.accepted_by === currentUserId && (
              <span className="text-blue-400 text-[9px] font-body">✋ Claimed by you</span>
            )}
          </div>
        </div>
        <span className="text-paper/30 text-xs shrink-0">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="border-t border-ink-800 p-4 space-y-3">
          {/* Context */}
          {req.context && (
            <div className="bg-ink-950 rounded-lg p-3">
              <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-1">Context provided</p>
              <p className="text-paper/60 text-xs font-body leading-relaxed italic">{req.context}</p>
            </div>
          )}

          {/* Follow-up sent */}
          {req.follow_up_question && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
              <p className="text-orange-400 text-[9px] font-body uppercase tracking-widest mb-1">Follow-up sent to member</p>
              <p className="text-paper/60 text-xs font-body">{req.follow_up_question}</p>
            </div>
          )}

          {/* Response given */}
          {req.response && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-[9px] font-body uppercase tracking-widest mb-1">Response submitted</p>
              <p className="text-paper/70 text-xs font-body leading-relaxed">{req.response}</p>
            </div>
          )}

          {/* Denial reason */}
          {req.denial_reason && (
            <div className="bg-ink-800 rounded-lg p-3">
              <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-1">Denied — reason</p>
              <p className="text-paper/40 text-xs font-body">{req.denial_reason}</p>
            </div>
          )}

          {/* Actions */}
          {canAct && mode === null && (
            <div className="flex flex-wrap gap-2 pt-1">
              {req.status === "pending" && (
                <button onClick={() => handle("accept")} disabled={saving}
                  className="text-[11px] font-body px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-40">
                  ✋ Accept &amp; claim
                </button>
              )}
              {(req.status === "accepted" || req.status === "in_progress") && isAcceptedByMe && (
                <button onClick={() => setMode("respond")}
                  className="text-[11px] font-body px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                  ✓ Respond
                </button>
              )}
              {req.status === "pending" && (
                <button onClick={() => setMode("followup")}
                  className="text-[11px] font-body px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                  ↩ Ask follow-up
                </button>
              )}
              {req.status === "pending" && (
                <button onClick={() => setMode("deny")}
                  className="text-[11px] font-body px-3 py-1.5 rounded-lg bg-ink-800 text-paper/40 border border-ink-700 hover:bg-loss/10 hover:text-loss hover:border-loss/30 transition-colors">
                  ✕ Deny
                </button>
              )}
            </div>
          )}

          {/* Respond form */}
          {mode === "respond" && (
            <div className="space-y-2">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest">Your research response</p>
              <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={6}
                placeholder="Write your research response here. Be thorough — this will be delivered to the member and archived in the knowledge base."
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => handle("respond")} disabled={saving || !responseText.trim()}
                  className="text-xs font-body px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-40">
                  {saving ? "Submitting…" : "Submit response"}
                </button>
                <button onClick={() => setMode(null)} className="text-xs font-body px-3 py-2 rounded-lg bg-ink-800 text-paper/40 hover:text-paper/70 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Follow-up form */}
          {mode === "followup" && (
            <div className="space-y-2">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest">Ask for more information</p>
              <textarea value={followUpText} onChange={e => setFollowUpText(e.target.value)} rows={3}
                placeholder="What additional information do you need from the member? E.g. 'Could you specify the time horizon — short-term trade or long-term hold? Also, which specific metrics matter most to you?'"
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none" />
              <p className="text-paper/25 text-[10px] font-body">This will be sent to the member's Human Intel page asking for more details.</p>
              <div className="flex gap-2">
                <button onClick={() => handle("followup")} disabled={saving || !followUpText.trim()}
                  className="text-xs font-body px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors disabled:opacity-40">
                  {saving ? "Sending…" : "Send follow-up"}
                </button>
                <button onClick={() => setMode(null)} className="text-xs font-body px-3 py-2 rounded-lg bg-ink-800 text-paper/40 hover:text-paper/70 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Deny form */}
          {mode === "deny" && (
            <div className="space-y-2">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest">Reason for denial</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["Scope too narrow for research", "Scope too broad — please narrow your question", "Outside Human Intel coverage area", "Duplicate of existing research"].map(r => (
                  <button key={r} onClick={() => setDenialReason(r)}
                    className={`text-[10px] font-body px-2 py-1 rounded border transition-colors ${denialReason === r ? "bg-loss/10 text-loss border-loss/30" : "bg-ink-800 text-paper/40 border-ink-700 hover:border-ink-600"}`}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)} rows={2}
                placeholder="Or write a custom reason…"
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-loss resize-none" />
              <div className="flex gap-2">
                <button onClick={() => handle("deny")} disabled={saving || !denialReason.trim()}
                  className="text-xs font-body px-4 py-2 rounded-lg bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20 transition-colors disabled:opacity-40">
                  {saving ? "Denying…" : "Confirm denial"}
                </button>
                <button onClick={() => setMode(null)} className="text-xs font-body px-3 py-2 rounded-lg bg-ink-800 text-paper/40 hover:text-paper/70 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {error && <p className="text-loss text-xs font-body">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function ResearchQueue({ requests, currentUserId }) {
  const [queue, setQueue] = useState(requests);
  const [filter, setFilter] = useState("active"); // 'active' | 'all'

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("human_intel_requests")
      .select("id, question, context, category, status, response, follow_up_question, denial_reason, created_at, accepted_by, accepted_at, answered_at, profiles!human_intel_requests_user_id_fkey(id, display_name, omega_score, admin_role)")
      .order("created_at", { ascending: false });
    setQueue(data || []);
  }

  const displayed = filter === "active"
    ? queue.filter(r => !["answered", "denied"].includes(r.status))
    : queue;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["active", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[10px] font-body px-3 py-1 rounded-full border transition-colors capitalize ${filter === f ? "bg-brass-400/10 text-brass-400 border-brass-400/30" : "bg-ink-800 text-paper/40 border-ink-700 hover:text-paper/70"}`}>
            {f === "active" ? `Active (${queue.filter(r => !["answered", "denied"].includes(r.status)).length})` : `All (${queue.length})`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="border border-ink-700 rounded-xl p-8 text-center">
          <p className="text-paper/20 text-3xl mb-2">🔬</p>
          <p className="text-paper/30 text-sm font-body">{filter === "active" ? "No active requests in the queue." : "No requests submitted yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(req => (
            <RequestCard key={req.id} req={req} currentUserId={currentUserId} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
