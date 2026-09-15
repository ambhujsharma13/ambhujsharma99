import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import HumanIntelForm from "../../../components/HumanIntelForm";

export const metadata = { title: "Human Intel & Reason — InfinityVolume" };

export default async function HumanIntelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Fetch this user's request (max 1 active)
  const { data: myRequests } = await supabase
    .from("human_intel_requests")
    .select("id, question, category, status, response, answered_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeRequest = (myRequests || []).find(r => r.status !== "answered");
  const pastRequests = (myRequests || []).filter(r => r.status === "answered");

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-2xl text-paper mb-3">Human Intel & Reason</h1>
        <p className="text-paper/50 text-sm font-body leading-relaxed">
          Submit a research question to be answered by the InfinityVolume research team — 
          real humans, not AI. Our analysts investigate markets, sectors, companies, and 
          macro questions with primary research and independent reasoning.
        </p>
        <div className="flex items-start gap-3 mt-4 p-4 border border-brass-400/20 rounded-xl bg-brass-400/5">
          <span className="text-brass-400 text-lg shrink-0">⚗️</span>
          <div>
            <p className="text-brass-400 text-xs font-body font-medium mb-0.5">Phase 1 — Human Powered</p>
            <p className="text-paper/50 text-xs font-body leading-relaxed">
              One active request per member at a time. Your question will be researched and 
              answered by a human analyst. Once answered, you can submit a new question. 
              Over time, answered questions build a searchable knowledge base.
            </p>
          </div>
        </div>
      </div>

      {/* Active request or submission form */}
      {activeRequest ? (
        <div className="mb-10">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Your active request</p>
          <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-body px-2 py-1 rounded-full border ${
                activeRequest.status === "in_progress"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              }`}>
                {activeRequest.status === "in_progress" ? "🔬 In progress" : "⏳ Pending review"}
              </span>
              <span className="text-paper/25 text-[10px] font-body">
                {new Date(activeRequest.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <p className="text-paper/80 text-sm font-body leading-relaxed mb-1">{activeRequest.question}</p>
            {activeRequest.category !== "general" && (
              <span className="text-[9px] font-body text-brass-400/60 bg-brass-400/5 px-1.5 py-0.5 rounded">{activeRequest.category}</span>
            )}
            {activeRequest.status === "in_progress" && (
              <p className="text-paper/30 text-xs font-body mt-3 border-t border-ink-800 pt-3">
                A research analyst is working on your question. You'll be notified when the response is ready.
              </p>
            )}
          </div>
          <p className="text-paper/25 text-xs font-body mt-3">
            You can submit a new question once your current request has been answered.
          </p>
        </div>
      ) : (
        <div className="mb-10">
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-3">Submit a research question</p>
          <HumanIntelForm userId={user.id} />
        </div>
      )}

      {/* Past answered requests */}
      {pastRequests.length > 0 && (
        <div>
          <p className="text-paper/30 text-[10px] font-body uppercase tracking-widest mb-4">
            Answered questions · {pastRequests.length}
          </p>
          <div className="space-y-4">
            {pastRequests.map(r => (
              <div key={r.id} className="border border-ink-700 rounded-xl bg-ink-900/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-body px-2 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                    ✓ Answered
                  </span>
                  <span className="text-paper/25 text-[10px] font-body">
                    {new Date(r.answered_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-paper/60 text-xs font-body mb-3 italic">Q: {r.question}</p>
                <div className="border-t border-ink-800 pt-3">
                  <p className="text-paper/25 text-[9px] font-body uppercase tracking-widest mb-2">Research Response</p>
                  <p className="text-paper/80 text-sm font-body leading-relaxed whitespace-pre-wrap">{r.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myRequests?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-paper/20 text-4xl mb-3">🔬</p>
          <p className="text-paper/40 text-sm font-body">No requests yet. Submit your first research question above.</p>
        </div>
      )}
    </main>
  );
}
