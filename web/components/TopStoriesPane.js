// Placeholder content — no CMS/publishing backend wired up yet. This is a
// working layout shell; swap PLACEHOLDER_STORIES for real articles once
// there's somewhere for your analysts to actually publish them.
const PLACEHOLDER_STORIES = [
  {
    title: "Why turnover, not volume, is the number that actually matters",
    snippet:
      "A $30B trading day means something different for NVIDIA than it does for a mid-cap Turkish bank. Here's how to read cross-market activity correctly.",
    author: "Infini Research Team",
  },
  {
    title: "Reading this week's cross-market turnover leaders",
    snippet:
      "Which markets saw the sharpest turnover spikes in the last 7 days, and what that typically signals about positioning.",
    author: "Infini Research Team",
  },
  {
    title: "Market cap vs. GDP: what the ratio is really telling you",
    snippet:
      "A country-by-country look at how tracked market cap compares to GDP, and why that comparison is more nuanced than it first appears.",
    author: "Infini Research Team",
  },
];

export default function TopStoriesPane() {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-lg text-paper">Top Stories</h2>
        <span className="text-paper/30 text-[10px] font-body">
          researched &amp; written by Infini analysts — coming soon
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLACEHOLDER_STORIES.map((story, i) => (
          <div key={i} className="border border-ink-800 rounded-md p-3 bg-ink-950/40">
            <h3 className="font-display text-sm text-paper mb-1.5 leading-snug">{story.title}</h3>
            <p className="text-paper/40 text-xs font-body leading-relaxed mb-2">{story.snippet}</p>
            <div className="text-brass-400/70 text-[10px] font-mono">{story.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
