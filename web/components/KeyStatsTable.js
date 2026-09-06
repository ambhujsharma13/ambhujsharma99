function formatUsd(value) {
  return value != null ? `$${value.toFixed(2)}` : "—";
}

function formatVolume(value) {
  if (value == null) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

function formatPct(value) {
  // yfinance returns dividend yield as a decimal fraction (e.g. 0.015 = 1.5%)
  return value != null ? `${(value * 100).toFixed(2)}%` : "—";
}

export default function KeyStatsTable({ stats, latestVolume }) {
  const rows = [
    { label: "Previous Close", value: formatUsd(stats?.previous_close_usd) },
    {
      label: "Day Range",
      value:
        stats?.day_low_usd != null && stats?.day_high_usd != null
          ? `${formatUsd(stats.day_low_usd)} – ${formatUsd(stats.day_high_usd)}`
          : "—",
    },
    {
      label: "52-Week Range",
      value:
        stats?.week52_low_usd != null && stats?.week52_high_usd != null
          ? `${formatUsd(stats.week52_low_usd)} – ${formatUsd(stats.week52_high_usd)}`
          : "—",
    },
    ...(stats?.pe_ratio !== undefined
      ? [{ label: "P/E Ratio", value: stats?.pe_ratio != null ? stats.pe_ratio.toFixed(2) : "—" }]
      : []),
    ...(stats?.dividend_yield !== undefined
      ? [{ label: "Dividend Yield", value: formatPct(stats?.dividend_yield) }]
      : []),
    { label: "Avg Volume", value: formatVolume(stats?.avg_volume) },
    { label: "Today's Volume", value: formatVolume(latestVolume) },
  ];

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <h2 className="font-display text-sm text-paper mb-3">Key Stats</h2>
      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between col-span-1">
            <dt className="text-paper/40 font-body">{row.label}</dt>
            <dd className="font-mono text-paper/80">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
