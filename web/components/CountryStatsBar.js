import { formatUsd, formatTurnoverPct } from "../lib/markets";

/**
 * Pure server-rendered content — no "use client" here on purpose. This is
 * exactly the kind of real, indexable text (not hidden behind client-side
 * JS) that search engines can actually crawl and rank.
 */
export default function CountryStatsBar({ stats, marketLabel }) {
  if (!stats) {
    return (
      <p className="text-paper/40 font-body text-sm">
        Country-level stats (GDP, market cap, turnover) aren&apos;t available
        for {marketLabel} yet.
      </p>
    );
  }

  const items = [
    {
      label: "GDP",
      value: formatUsd(stats.gdp_usd),
      sub: stats.gdp_year ? `${stats.gdp_year}, World Bank` : null,
    },
    {
      label: `${stats.index100_label || "Index"} market cap`,
      value: formatUsd(stats.index100_market_cap_usd),
      sub: stats.index100_count ? `${stats.index100_count} names tracked` : null,
    },
    {
      label: "Market cap / GDP",
      value:
        stats.market_cap_to_gdp_pct !== null && stats.market_cap_to_gdp_pct !== undefined
          ? `${stats.market_cap_to_gdp_pct.toFixed(2)}%`
          : "—",
      sub: `${stats.index100_label || "index"} vs. GDP`,
    },
    {
      label: "Turnover (1d)",
      value: formatTurnoverPct(stats.aggregate_daily_turnover_pct),
      sub: "watchlist $ vol / watchlist cap",
    },
    {
      label: "Turnover (3d)",
      value: formatTurnoverPct(stats.aggregate_3d_turnover_pct),
      sub: "watchlist $ vol / watchlist cap",
    },
    {
      label: stats.fx_currency ? `${stats.fx_currency} / USD` : "Currency",
      value: stats.fx_rate_usd != null ? `$${stats.fx_rate_usd.toFixed(6)}` : "—",
      sub:
        stats.fx_daily_change_pct != null
          ? `${stats.fx_daily_change_pct > 0 ? "+" : ""}${stats.fx_daily_change_pct.toFixed(3)}% (1d)`
          : stats.fx_currency
          ? null
          : "base currency",
    },
    {
      label: "10Y Govt Bond Yield",
      value: stats.bond_yield_10y_pct != null ? `${stats.bond_yield_10y_pct.toFixed(2)}%` : "—",
      sub: stats.bond_yield_note || null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">
            {item.label}
          </div>
          <div className="font-mono text-lg text-brass-400 mt-1">{item.value}</div>
          {item.sub && <div className="text-paper/30 text-[10px] font-body mt-0.5">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}
