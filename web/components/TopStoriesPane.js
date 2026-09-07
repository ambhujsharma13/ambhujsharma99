// Placeholder content — no CMS/publishing backend wired up yet, same
// status as before. Redesigned from a 3-column card grid into a narrow,
// scrollable list to sit in the new right-hand column, matching the
// Discussions panel's visual language (same width, roughly double the
// visible height since this panel now carries more content).
const PLACEHOLDER_STORIES = [
  {
    title: "Why turnover, not volume, is the number that actually matters",
    snippet: "A $30B trading day means something different for NVIDIA than a mid-cap Turkish bank.",
  },
  {
    title: "Reading this week's cross-market turnover leaders",
    snippet: "Which markets saw the sharpest turnover spikes in the last 7 days, and what that signals.",
  },
  {
    title: "Market cap vs. GDP: what the ratio is really telling you",
    snippet: "A country-by-country look at tracked market cap against GDP, and its real nuance.",
  },
  {
    title: "US Treasury yields, five maturities, one screen",
    snippet: "What the shape of the yield curve across 3-month to 10-year is signaling right now.",
  },
  {
    title: "How to read a turnover ratio heatmap",
    snippet: "A quick primer on the metric behind every table on this site, and why it beats raw volume.",
  },
];

export default function TopStoriesPane() {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 mb-4">
      <div className="px-3 py-2.5 border-b border-ink-700">
        <h2 className="font-display text-sm text-paper">Infinity Published Stories</h2>
        <p className="text-paper/30 text-[10px] font-body mt-0.5">
          member-published articles — coming soon
        </p>
      </div>
      {/* Roughly double DiscussionTopicsList's max-h-44, since this panel
          carries a title + snippet per row rather than a single line. */}
      <ul className="max-h-96 overflow-y-auto divide-y divide-ink-800">
        {PLACEHOLDER_STORIES.map((story, i) => (
          <li key={i} className="px-3 py-2.5">
            <div className="text-paper/70 text-xs font-body leading-snug mb-1">{story.title}</div>
            <div className="text-paper/35 text-[11px] font-body leading-snug">{story.snippet}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
