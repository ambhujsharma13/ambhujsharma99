// Placeholder content — there's no discussion/community backend yet (that
// would need the auth + database layer planned for later, per our earlier
// architecture conversation). This is a working UI shell so the layout is
// real and ready; swap PLACEHOLDER_TOPICS for real data once that backend
// exists.
const PLACEHOLDER_TOPICS = [
  "Is China's tech rally sustainable into next quarter?",
  "Reading the Fed's next move from bond yields",
  "Why Korean semiconductor names are outperforming",
  "Turkey's lira: stabilizing or just paused?",
  "Gold vs. Bitcoin as an inflation hedge in 2026",
  "What Brazil's rate cuts mean for EM equities",
  "India's Nifty 50 concentration risk, explained",
  "Japan's yen carry trade unwind — what to watch",
  "Europe's energy names after the winter demand data",
  "Are commodity markets pricing in a soft landing?",
];

export default function DiscussionTopicsList() {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 mb-4">
      <div className="px-3 py-2.5 border-b border-ink-700">
        <h2 className="font-display text-sm text-paper">Discussions</h2>
        <p className="text-paper/30 text-[10px] font-body mt-0.5">
          Community topics — coming soon
        </p>
      </div>
      {/* Shows ~4 rows before scrolling — each row is roughly 44px tall,
          so max-h-44 (176px) reveals about four and scrolls for the rest. */}
      <ul className="max-h-44 overflow-y-auto divide-y divide-ink-800">
        {PLACEHOLDER_TOPICS.map((topic, i) => (
          <li key={i}>
            <button
              disabled
              className="w-full text-left px-3 py-2.5 text-xs font-body text-paper/50 cursor-default"
              title="Discussions aren't live yet"
            >
              {topic}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
