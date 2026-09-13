"use client";

import { useState, useTransition } from "react";
import { submitSupportTicket } from "../lib/support-actions";

const TYPES = [
  { value: "bug", label: "🐛 Bug report", placeholder: "Describe what happened and what you expected" },
  { value: "feature", label: "💡 Feature request", placeholder: "Describe the feature and why it would be useful" },
  { value: "data_issue", label: "📊 Data issue", placeholder: "Describe the incorrect or missing data" },
  { value: "dataset_request", label: "📂 Dataset request", placeholder: "Describe the dataset and why it's valuable" },
];

export default function SupportTicketForm() {
  const [type, setType] = useState("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticker, setTicker] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedType = TYPES.find(t => t.value === type);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await submitSupportTicket({
        ticketType: type,
        title,
        description,
        affectedTicker: ticker,
        affectedPageUrl: typeof window !== "undefined" ? document.referrer : null,
      });
      if (result?.error) setError(result.error);
      else { setDone(true); }
    });
  }

  if (done) {
    return (
      <div className="border border-ink-700 rounded-lg bg-ink-900 p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-paper/80 font-body text-sm mb-1">Submitted!</p>
        <p className="text-paper/40 text-xs font-body mb-4">Our team will review this shortly.</p>
        <button
          onClick={() => { setDone(false); setTitle(""); setDescription(""); setTicker(""); }}
          className="text-brass-400 text-xs font-body hover:underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-5">
      <h2 className="text-paper/80 text-sm font-body font-medium mb-4">Submit feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-paper/40 text-xs font-body mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-1">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`text-xs font-body py-1.5 px-2 rounded text-left transition-colors ${
                  type === t.value ? "bg-brass-400/20 text-brass-400" : "text-paper/50 hover:bg-ink-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-paper/40 text-xs font-body mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={`Brief ${type === "bug" ? "bug description" : "title"}…`}
            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400"
          />
        </div>

        {type === "data_issue" && (
          <div>
            <label className="block text-paper/40 text-xs font-body mb-1.5">Ticker / indicator</label>
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="e.g. AAPL, US 10-Yr yield…"
              className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400"
            />
          </div>
        )}

        <div>
          <label className="block text-paper/40 text-xs font-body mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={selectedType?.placeholder}
            rows={4}
            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm font-body text-paper/80 placeholder:text-paper/20 focus:outline-none focus:border-brass-400 resize-none"
          />
        </div>

        {error && <p className="text-loss text-xs font-body">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !title.trim() || !description.trim()}
          className="w-full bg-brass-400 text-ink-950 text-sm font-body font-medium rounded-md py-2 hover:bg-brass-300 transition-colors disabled:opacity-40"
        >
          {isPending ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
