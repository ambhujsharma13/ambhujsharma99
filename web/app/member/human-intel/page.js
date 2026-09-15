import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import HumanIntelForm from "../../../components/HumanIntelForm";
import PublicChannelSearch from "../../../components/PublicChannelSearch";

export const metadata = { title: "Human Intel & Reason — InfinityVolume" };

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const CATEGORY_LABELS = {
  general: "General Research",
  company: "Company / Stock",
  sector: "Sector / Industry",
  macro: "Macro / Economy",
  commodity: "Commodity / Resource",
  policy: "Policy / Regulation",
  technology: "Technology / Innovation",
};

export default async function HumanIntelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: myRequests, error: fetchErr } = await supabase
    .from("human_intel_requests")
    .select("id, question, context, category, status, response, answered_at, follow_up_question, denial_reason, created_at, viewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchErr) console.error("[human-intel] fetch error:", fetchErr.message);

  // Mark unread answered/follow_up/denied as viewed — clears the sidebar dot
  const unreadIds = (myRequests || [])
    .filter(r => ["answered", "follow_up_requested", "denied"].includes(r.status) && !r.viewed_at)
    .map(r => r.id);
  if (unreadIds.length > 0) {
    await supabase
      .from("human_intel_requests")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  const activeRequest = (myRequests || []).find(r => !["answered", "denied"].includes(r.status));
  const deniedRequests = (myRequests || []).filter(r => r.status === "denied");
  const pastRequests = (myRequests || []).filter(r => r.status === "answered");

  const STATUS_PILL = {
    pending: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">⏳ Pending review</span>,
    accepted: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">✋ Accepted by analyst</span>,
    in_progress: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">🔬 In progress</span>,
    follow_up_requested: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20">↩ Follow-up needed</span>,
    answered: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">✓ Answered</span>,
    denied: <span className="text-[10px] font-body px-2 py-0.5 rounded-full border bg-ink-700 text-paper/30 border-ink-600">✕ Denied</span>,
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-brass-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          <h1 className="font-display text-2xl text-paper">Human Intel & Reason</h1>
        </div>
        <p className="text-paper/50 text-sm font-body leading-relaxed max-w-2xl">
          Submit a research question to be answered by the InfinityVolume research team — real humans, not AI. 
          One active request at a time. Answered questions build a permanent knowledge base.
        </p>
        <div className="flex items-start gap-3 mt-4 p-3 border border-brass-400/20 rounded-xl bg-brass-400/5 max-w-2xl">
          <span className="text-brass-400 text-sm shrink-0 mt-0.5">⚗️</span>
          <p className="text-paper/40 text-[11px] font-body leading-relaxed">
            <span className="text-brass-400 font-medium">Phase 1 — Human Powered.</span> Your question is researched by a human analyst, not AI. 
            Phase 3 will layer ML on top of the growing Q&A repository.
          </p>
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex gap-6">

        {/* LEFT — Submission / Active request */}
        <div className="flex-1 min-w-0">
          {activeRequest ? (
            <div className="mb-8">
              <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Your active request</p>
              <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  {STATUS_PILL[activeRequest.status]}
                  <span className="text-paper/25 text-[10px] font-body">{timeAgo(activeRequest.created_at)}</span>
                </div>
                {activeRequest.category && activeRequest.category !== "general" && (
                  <span className="text-[9px] font-body text-brass-400/60 bg-brass-400/5 px-1.5 py-0.5 rounded border border-brass-400/10 mb-3 inline-block">
                    {CATEGORY_LABELS[activeRequest.category]}
                  </span>
                )}
                <p className="text-paper/80 text-sm font-body leading-relaxed mb-2">{activeRequest.question}</p>
                {activeRequest.context && (
                  <p className="text-paper/40 text-xs font-body italic border-t border-ink-800 pt-2 mt-2">
                    Context: {activeRequest.context}
                  </p>
                )}
                {activeRequest.status === "in_progress" && (
                  <p className="text-paper/30 text-xs font-body mt-3 border-t border-ink-800 pt-3">
                    A research analyst is working on your question. You'll be notified when the response is ready.
                  </p>
                )}
                {activeRequest.status === "follow_up_requested" && activeRequest.follow_up_question && (
                  <div className="mt-3 border-t border-ink-800 pt-3">
                    <p className="text-orange-400 text-[9px] font-body uppercase tracking-widest mb-2">Our team needs more details</p>
                    <p className="text-paper/70 text-sm font-body leading-relaxed">{activeRequest.follow_up_question}</p>
                    <p className="text-paper/30 text-xs font-body mt-2">Please reply with the additional context requested. You can submit a new question with the updated details — include the follow-up information in your context field.</p>
                  </div>
                )}
              </div>
              <p className="text-paper/20 text-xs font-body mt-2">
                You can submit a new question once your current request is answered.
              </p>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Submit a research question</p>
              <HumanIntelForm userId={user.id} />
            </div>
          )}

          {/* Past answered Q&A */}
          {pastRequests.length > 0 && (
            <div>
              <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-4">
                Your answered questions · {pastRequests.length}
              </p>
              <div className="space-y-4">
                {pastRequests.map(r => (
                  <div key={r.id} className="border border-ink-700 rounded-xl bg-ink-900/60 p-5">
                    <div className="flex items-center justify-between mb-3">
                      {STATUS_PILL.answered}
                      <span className="text-paper/25 text-[10px] font-body">
                        {r.answered_at ? new Date(r.answered_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    {r.category && r.category !== "general" && (
                      <span className="text-[9px] font-body text-brass-400/60 bg-brass-400/5 px-1.5 py-0.5 rounded mb-2 inline-block">
                        {CATEGORY_LABELS[r.category]}
                      </span>
                    )}
                    <p className="text-paper/50 text-xs font-body italic mb-1">Q: {r.question}</p>
                    {r.context && (
                      <p className="text-paper/30 text-[11px] font-body italic mb-3">Context: {r.context}</p>
                    )}
                    <div className="border-t border-ink-800 pt-3">
                      <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-2">Research Response</p>
                      <p className="text-paper/80 text-sm font-body leading-relaxed whitespace-pre-wrap">{r.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!myRequests || myRequests.length === 0) && (
            <div className="text-center py-16 border border-ink-800 rounded-xl">
              <p className="text-paper/20 text-4xl mb-3">🔬</p>
              <p className="text-paper/30 text-sm font-body">No requests yet. Submit your first research question above.</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-80 shrink-0 space-y-4">

          {/* Universal Search — Public Channels */}
          <div className="border border-ink-700 rounded-xl bg-ink-900/60 overflow-hidden">
            <PublicChannelSearch />
          </div>

          {/* Previous requests history */}
          <div className="border border-ink-700 rounded-xl bg-ink-900/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-800 flex items-center justify-between">
              <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest">Your Request History</p>
              <span className="text-paper/25 text-[10px] font-body">{(myRequests || []).length} total</span>
            </div>

            {(!myRequests || myRequests.length === 0) ? (
              <p className="text-paper/20 text-xs font-body p-4 text-center">No requests yet</p>
            ) : (
              <div className="divide-y divide-ink-800 max-h-96 overflow-y-auto">
                {myRequests.map(r => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-paper/70 text-xs font-body leading-snug line-clamp-2 flex-1">{r.question}</p>
                      <div className="shrink-0 mt-0.5">
                        {r.status === "answered" && <span className="text-[9px] text-green-400">✓</span>}
                        {r.status === "in_progress" && <span className="text-[9px] text-blue-400">🔬</span>}
                        {r.status === "pending" && <span className="text-[9px] text-yellow-400">⏳</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.category && r.category !== "general" && (
                        <span className="text-[9px] font-body text-paper/25">{CATEGORY_LABELS[r.category]}</span>
                      )}
                      <span className="text-paper/20 text-[9px] font-body ml-auto">{timeAgo(r.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
