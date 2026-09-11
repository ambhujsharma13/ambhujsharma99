"use client";

import { useState, useMemo } from "react";

function formatCount(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function formatVolume(n) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// Capitalizes each word — the raw category names come back lowercase
// from FINRA ("investment grade", "church bonds") and read better
// title-cased in a table than left as-is or forced to uppercase.
function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CorporateBondSentimentTable({ history }) {
  const [dateIndex, setDateIndex] = useState(0);

  if (!history || history.length === 0) {
    return <p className="text-paper/30 text-sm font-body py-4">No data available yet.</p>;
  }

  const day = history[dateIndex];
  const byType = day?.by_trade_type || {};

  // "all securities" is the aggregate across every other category in
  // the same day — confirmed by checking its volume against the sum of
  // the rest (they matched) — so it's shown as the headline total, not
  // as one more row alongside the categories it already includes.
  // Everything else, sorted by volume descending so the categories that
  // actually moved the market lead the table.
  const { total, categories } = useMemo(() => {
    const entries = Object.entries(byType);
    const totalEntry = entries.find(([name]) => name.toLowerCase() === "all securities");
    const categoryEntries = entries
      .filter(([name]) => name.toLowerCase() !== "all securities")
      .sort((a, b) => (b[1].total_volume || 0) - (a[1].total_volume || 0));
    return { total: totalEntry?.[1], categories: categoryEntries };
  }, [byType]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-paper/50 text-xs font-body">Date:</label>
        <select
          value={dateIndex}
          onChange={(e) => setDateIndex(Number(e.target.value))}
          className="bg-ink-800 border border-ink-700 rounded-md px-2 py-1 text-xs font-mono text-paper"
        >
          {history.map((d, i) => (
            <option key={d.date} value={i}>
              {d.date}
            </option>
          ))}
        </select>
      </div>

      {total && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-4">
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-2">All Securities (total)</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono">
            <span className="text-paper/80">{formatCount(total.total_transactions)} transactions</span>
            <span className="text-paper/80">{formatCount(total.total_trades)} trades</span>
            <span className="text-brass-400">{formatVolume(total.total_volume)} volume</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium text-right">Transactions</th>
              <th className="py-2 pr-4 font-medium text-right">Trades</th>
              <th className="py-2 pr-4 font-medium text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {categories.map(([name, stats]) => (
              <tr key={name} className="border-b border-ink-800">
                <td className="py-2 pr-4 font-body text-paper/80 whitespace-nowrap">{titleCase(name)}</td>
                <td className="py-2 pr-4 text-right font-mono text-paper/60">{formatCount(stats.total_transactions)}</td>
                <td className="py-2 pr-4 text-right font-mono text-paper/60">{formatCount(stats.total_trades)}</td>
                <td className="py-2 pr-4 text-right font-mono text-brass-400">{formatVolume(stats.total_volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
