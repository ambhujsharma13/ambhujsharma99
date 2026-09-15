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
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || submitting) return;
    if (question.trim().length < 20) {
      setError("Please provide more detail — at least 20 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("human_intel_requests").insert({
      user_id: userId,
      question: question.trim(),
      category,
    });
    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      // Reload to show the active request
      window.location.reload();
    }
  }

  if (success) return (
    <div className="border border-green-500/20 rounded-xl bg-green-500/5 p-5">
      <p className="text-green-400 text-sm font-body font-medium">✓ Request submitted</p>
      <p className="text-paper/50 text-xs font-body mt-1">Our research team will get back to you. Reloading…</p>
    </div>
  );

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

      {error && <p className="text-loss text-xs font-body">{error}</p>}

      <button
        type="submit"
        disabled={submitting || question.trim().length < 20}
        className="w-full bg-brass-400 text-ink-950 text-sm font-body font-medium py-2.5 rounded-lg hover:bg-brass-300 transition-colors disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit to Research Team"}
      </button>

      <p className="text-paper/20 text-[10px] font-body text-center leading-relaxed">
        Your question will be researched by a human analyst — not AI. Response times vary by complexity, typically 1–5 business days.
      </p>
    </form>
  );
}
