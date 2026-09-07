function timeAgo(pubDateStr) {
  if (!pubDateStr) return "";
  // NewsData.io returns "YYYY-MM-DD HH:MM:SS" in UTC
  const pubDate = new Date(pubDateStr.replace(" ", "T") + "Z");
  const hours = Math.floor((Date.now() - pubDate.getTime()) / 3600000);
  if (hours < 1) return "just now";
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NewsFlash({ data }) {
  const articles = data?.articles || [];

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 mb-4">
      <div className="px-3 py-2.5 border-b border-ink-700">
        <h2 className="font-display text-sm text-paper">News Flash</h2>
        <p className="text-paper/30 text-[10px] font-body mt-0.5">
          Matched to your tracked tickers &amp; macro topics
        </p>
      </div>
      {articles.length === 0 ? (
        <p className="text-paper/40 font-body text-xs px-3 py-4">
          No matched news yet — run <code className="font-mono text-brass-400">python scripts/news_fetch.py</code>.
        </p>
      ) : (
        <ul className="max-h-96 overflow-y-auto divide-y divide-ink-800">
          {articles.map((a, i) => (
            <li key={a.url || i} className="px-3 py-2.5">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper/70 text-xs font-body leading-snug hover:text-brass-400 block"
              >
                {a.title}
              </a>
              <div className="flex items-center justify-between mt-1">
                <span className="text-paper/25 text-[10px] font-mono">
                  {(a.matched || []).slice(0, 3).join(", ")}
                </span>
                <span className="text-paper/25 text-[10px] font-body whitespace-nowrap ml-2">
                  {a.source && `${a.source} · `}
                  {timeAgo(a.pub_date)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.fetched_at && (
        <p className="text-paper/20 text-[9px] font-body px-3 py-2 border-t border-ink-800">
          Updated {new Date(data.fetched_at).toUTCString()}
        </p>
      )}
    </div>
  );
}
