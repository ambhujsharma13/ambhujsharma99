"use client";

import { useState, useMemo } from "react";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";

// Trading-day counts (not calendar days) for each toggle — approximate
// but reasonable: markets are closed weekends and ~9-10 holidays/year,
// so "1 month" of daily rows is closer to 21 trading days than 30.
const RANGE_OPTIONS = [
  { key: "1D", label: "1D", tradingDays: 1 },
  { key: "3D", label: "3D", tradingDays: 3 },
  { key: "1W", label: "1W", tradingDays: 5 },
  { key: "1M", label: "1M", tradingDays: 21 },
  { key: "3M", label: "3M", tradingDays: 65 },
];

function formatCount(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

export default function CorporateBondHistoryTable({ history }) {
  const [range, setRange] = useState("1M");
  const [sort, setSort] = useState({ key: "date", direction: "desc" });

  const activeRange = RANGE_OPTIONS.find((r) => r.key === range) || RANGE_OPTIONS[3];

  // History arrives already sorted most-recent-first from the backend
  // — slicing to the toggle's trading-day count happens BEFORE sorting,
  // so switching sort columns never changes which underlying days are
  // in view, only their order within that fixed window.
  const windowRows = useMemo(() => (history || []).slice(0, activeRange.tradingDays), [history, activeRange]);

  const sortedRows = useMemo(
    () =>
      sortRows(windowRows, sort, (row, key) => {
        if (key === "date") return row.date;
        return row[key];
      }),
    [windowRows, sort]
  );

  function handleSort(key) {
    setSort((current) => nextSortState(current, key, key === "date"));
  }

  if (!history || history.length === 0) {
    return <p className="text-paper/30 text-sm font-body py-4">No historical data available yet.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`px-3 py-1 rounded-md text-xs font-body transition-colors ${
              range === opt.key
                ? "bg-brass-400 text-ink-950 font-medium"
                : "text-paper/50 border border-ink-700 hover:bg-ink-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
              <SortableHeader label="Date" sortKey="date" currentSort={sort} onSort={handleSort} />
              <SortableHeader label="Advances" sortKey="advances" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="Declines" sortKey="declines" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="Unchanged" sortKey="unchanged" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="Trades" sortKey="total_trades" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="Volume" sortKey="total_volume" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="52w High" sortKey="fifty_two_week_high" currentSort={sort} onSort={handleSort} align="right" />
              <SortableHeader label="52w Low" sortKey="fifty_two_week_low" currentSort={sort} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody className="tabular">
            {sortedRows.map((row) => (
              <tr key={row.date} className="border-b border-ink-800">
                <td className="py-2 pr-4 font-body text-paper/80 whitespace-nowrap">{row.date}</td>
                <td className="py-2 pr-4 text-right font-mono text-gain">{formatCount(row.advances)}</td>
                <td className="py-2 pr-4 text-right font-mono text-loss">{formatCount(row.declines)}</td>
                <td className="py-2 pr-4 text-right font-mono text-paper/60">{formatCount(row.unchanged)}</td>
                <td className="py-2 pr-4 text-right font-mono text-paper/60">{formatCount(row.total_trades)}</td>
                <td className="py-2 pr-4 text-right font-mono text-brass-400">{formatCount(row.total_volume)}</td>
                <td className="py-2 pr-4 text-right font-mono text-gain">{formatCount(row.fifty_two_week_high)}</td>
                <td className="py-2 pr-4 text-right font-mono text-loss">{formatCount(row.fifty_two_week_low)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-paper/25 text-[10px] font-body mt-2">
        Showing {sortedRows.length} trading day{sortedRows.length === 1 ? "" : "s"}. Click any column header to sort.
      </p>
    </div>
  );
}
