"use client";

import Link from "next/link";
import Sparkline from "./Sparkline";
import CompanyLogo from "./CompanyLogo";
import { computeRangeStats } from "../lib/rangeStats";
import { formatPct, formatUsd, formatTurnoverPct } from "../lib/markets";

export default function DataTable({ tickers, range, marketKey }) {
  const rows = Object.entries(tickers)
    .filter(([symbol]) => !symbol.startsWith("__"))
    .map(([symbol, history]) => {
      const name = tickers[`__name__${symbol}`] || symbol;
      const stats = computeRangeStats(history, range.startDate, range.endDate);
      const sparklineData = history.slice(-14);
      return { symbol, name, stats, sparklineData };
    })
    .filter((r) => r.stats !== null) // no data in this window (e.g. market closed that day) — omit rather than show a false zero
    .sort((a, b) => (b.stats.cumulativeVolumeUsd ?? 0) - (a.stats.cumulativeVolumeUsd ?? 0));

  if (rows.length === 0) {
    return (
      <div className="text-paper/50 font-body py-16 text-center">
        No trading data for this date range — try a different range, or run{" "}
        <code className="font-mono text-brass-400">python scripts/fetch_data.py</code> if data hasn&apos;t been fetched yet.
      </div>
    );
  }

  const rangeLabel =
    range.startDate === range.endDate ? "1 day" : `${rows[0].stats.tradingDaysCount} trading days`;

  // shading intensity for the turnover column, same idea as before — the
  // headline metric should visibly stand out, not sit as plain text.
  const turnoverValues = rows.map((r) => r.stats.turnoverPct).filter((v) => v !== null && v !== undefined);
  const maxTurnover = turnoverValues.length ? Math.max(...turnoverValues) : 0;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
          <th className="py-3 pr-4 font-medium w-8">#</th>
          <th className="py-3 pr-4 font-medium">Ticker</th>
          <th className="py-3 pr-4 font-medium text-right">Price (USD)</th>
          <th className="py-3 pr-4 font-medium text-right">Change ({rangeLabel})</th>
          <th className="py-3 pr-4 font-medium text-right">Market Cap</th>
          <th className="py-3 pr-4 font-medium text-right">Volume ({rangeLabel})</th>
          <th className="py-3 pr-4 font-medium text-right">Turnover</th>
          <th className="py-3 pr-4 font-medium">Trend</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((r, i) => {
          const { stats } = r;
          const positive = (stats.changePct ?? 0) >= 0;
          const intensity = maxTurnover > 0 && stats.turnoverPct ? Math.min(stats.turnoverPct / maxTurnover, 1) : 0;
          return (
            <tr key={r.symbol} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors">
              <td className="py-3 pr-4 font-mono text-paper/40">{i + 1}</td>
              <td className="py-3 pr-4">
                <Link
                  href={`/markets/${marketKey}/${encodeURIComponent(r.symbol)}`}
                  className="flex items-center gap-2.5 group"
                >
                  <CompanyLogo symbol={r.symbol} name={r.name} size={26} />
                  <div>
                    <div className="font-mono text-brass-400 group-hover:underline">{r.symbol}</div>
                    <div className="text-paper/50 text-xs font-body group-hover:text-paper/80">{r.name}</div>
                  </div>
                </Link>
              </td>
              <td className="py-3 pr-4 text-right font-mono">
                {formatUsd(stats.endClose, { compact: false })}
              </td>
              <td className={`py-3 pr-4 text-right font-mono ${positive ? "text-gain" : "text-loss"}`}>
                {formatPct(stats.changePct)}
              </td>
              <td className="py-3 pr-4 text-right font-mono text-paper/70">
                {formatUsd(stats.marketCapUsd)}
              </td>
              <td className="py-3 pr-4 text-right font-mono">{formatUsd(stats.cumulativeVolumeUsd)}</td>
              <td
                className="py-3 pr-4 text-right font-mono relative"
                style={{
                  backgroundColor:
                    intensity > 0 ? `rgba(217, 164, 65, ${0.08 + intensity * 0.3})` : "transparent",
                }}
              >
                <span className={intensity > 0.5 ? "text-brass-400" : "text-paper/80"}>
                  {formatTurnoverPct(stats.turnoverPct)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Sparkline data={r.sparklineData} positive={positive} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
