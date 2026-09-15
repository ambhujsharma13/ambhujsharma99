"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

const CATEGORIES = [
  { value: "general", label: "General Research" },
  { value: "company", label: "Company / Stock" },
  { value: "sector", label: "Sector / Industry" },
  { value: "macro", label: "Macro / Economy" },
  { value: "commodity", label: "Commodity / Resource" },
  { value: "policy", label: "Policy / Regulation" },
  { value: "technology", label: "Technology / Innovation" },
];

export default function HumanIntelForm({ userId }) {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null); // { id, question, status } of existing active request
  const [recalling, setRecalling] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || submitting) return;
    if (question.trim().length < 20) {
      setError("Please provide more detail — at least 20 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setBlocked(null);

    const supabase = createClient();

    // Check for existing active request before inserting
    const { data: existing } = await supabase
      .from("human_intel_requests")
      .select("id, question, status")
      .eq("user_id", userId)
      .not("status", "in", '("answered","denied")')
      .limit(1)
      .maybeSingle();

    if (existing) {
      setBlocked(existing);
      setSubmitting(false);
      return;
    }

    const { error: err } = await supabase.from("human_intel_requests").insert({
      user_id: userId,
      question: question.trim(),
      context: context.trim() || null,
      category,
    });

    if (err) {
      // Catch DB-level unique violation as well
      if (err.code === "23505" || err.message?.includes("unique")) {
        const { data: ex } = await supabase
          .from("human_intel_requests")
          .select("id, question, status")
          .eq("user_id", userId)
          .not("status", "in", '("answered","denied")')
          .limit(1)
          .maybeSingle();
        setBlocked(ex || { question: "an existing request", status: "pending" });
      } else {
        setError(err.message);
      }
    } else {
      window.location.reload();
    }
    setSubmitting(false);
  }

  async function handleRecall() {
    if (!blocked?.id || recalling) return;
    setRecalling(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("human_intel_requests")
      .delete()
      .eq("id", blocked.id)
      .eq("user_id", userId);

    if (err) {
      setError("Could not recall: " + err.message);
    } else {
      setBlocked(null);
      setError(null);
      // Now submit the new one
      const supabase2 = createClient();
      const { error: err2 } = await supabase2.from("human_intel_requests").insert({
        user_id: userId,
        question: question.trim(),
        context: context.trim() || null,
        category,
      });
      if (err2) setError(err2.message);
      else window.location.reload();
    }
    setRecalling(false);
  }

  // Blocked state — show clear message
  if (blocked) {
    return (
      <div className="border border-yellow-500/20 rounded-xl bg-yellow-500/5 p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-yellow-400 text-sm font-body font-medium mb-1">You already have a request in the queue</p>
            <p className="text-paper/50 text-xs font-body leading-relaxed">
              Only one active request is allowed at a time. Your current request must be answered or denied before you can submit a new one.
            </p>
          </div>
        </div>

        <div className="bg-ink-900/80 border border-ink-700 rounded-lg p-3 mb-4">
          <p className="text-paper/30 text-[9px] font-body uppercase tracking-widest mb-1">Your active request</p>
          <p className="text-paper/70 text-xs font-body line-clamp-3">{blocked.question}</p>
          <span className={`text-[9px] font-body px-1.5 py-0.5 rounded border mt-2 inline-block ${
            blocked.status === "accepted" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
            : blocked.status === "in_progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
            : blocked.status === "follow_up_requested" ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          }`}>
            {blocked.status === "accepted" ? "✋ Accepted by analyst"
              : blocked.status === "in_progress" ? "🔬 In progress"
              : blocked.status === "follow_up_requested" ? "↩ Follow-up requested"
              : "⏳ Pending review"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecall}
            disabled={recalling || blocked.status === "in_progress" || blocked.status === "accepted"}
            className="text-xs font-body px-3 py-2 rounded-lg border bg-loss/10 text-loss border-loss/30 hover:bg-loss/20 transition-colors disabled:opacity-40"
          >
            {recalling ? "Recalling…" : "↩ Recall & replace with this question"}
          </button>
          <button
            onClick={() => setBlocked(null)}
            className="text-xs font-body text-paper/30 hover:text-paper/60 transition-colors"
          >
            Cancel
          </button>
        </div>

        {(blocked.status === "in_progress" || blocked.status === "accepted") && (
          <p className="text-paper/25 text-[10px] font-body mt-3">
            This request has been accepted by an analyst and cannot be recalled. Please wait for their response.
          </p>
        )}

        {error && <p className="text-loss text-xs font-body mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 focus:outline-none focus:border-brass-400"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">
          Your Research Question
        </label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Describe what you want researched. Be specific — the more context you provide, the better the response. E.g. 'What is the current competitive positioning of Coherent Corp in the 800G optical transceiver market vs Lumentum, and what are the key risks to their gross margin expansion in 2027?'"
          rows={6}
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-paper/20 text-[10px] font-body">
            {question.length < 20 ? `${20 - question.length} more characters needed` : `${question.length} characters`}
          </p>
          <p className="text-paper/20 text-[10px] font-body">1 active request limit</p>
        </div>
      </div>

      <div>
        <label className="text-paper/40 text-[10px] font-body uppercase tracking-widest block mb-2">
          Context <span className="text-paper/20 normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Please provide the context in which you are asking this question — your investment thesis, portfolio position, time horizon, or any relevant background. This helps us provide more tailored perspectives."
          rows={3}
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
        />
      </div>

      {error && <p className="text-loss text-xs font-body">{error}</p>}

      <button
        type="submit"
        disabled={submitting || question.trim().length < 20}
        className="w-full bg-brass-400 text-ink-950 text-sm font-body font-medium py-2.5 rounded-lg hover:bg-brass-300 transition-colors disabled:opacity-40"
      >
        {submitting ? "Checking…" : "Submit to Research Team"}
      </button>

      <p className="text-paper/20 text-[10px] font-body text-center leading-relaxed">
        Your question will be researched by a human analyst — not AI. Response times vary by complexity, typically 1–5 business days.
      </p>
    </form>
  );
}
