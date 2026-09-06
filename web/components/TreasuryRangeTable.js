"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import RangeSelector from "./RangeSelector";
import FlagIcon from "./FlagIcon";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";
import { computeYieldRangeStats, getAvailableYieldDates } from "../lib/yieldRangeStats";
import { getMarketMeta } from "../lib/markets";

const US_TENORS = [
  { key: "3mo", label: "US 3-Month" },
  { key: "1yr", label: "US 1-Yr" },
  { key: "2yr", label: "US 2-Yr" },
  { key: "5yr", label: "US 5-Yr" },
  { key: "10yr", label: "US 10-Yr" },
];

const PRESETS = [
  { label: "1 Day", days: 1 },
  { label: "3 Day", days: 3 },
  { label: "5 Day", days: 5 },
  { label: "7 Day", days: 7 },
];

export default function TreasuryRangeTable({ yields }) {
  const allHistories = useMemo(() => {
    const histories = US_TENORS.map((t) => yields?.[t.key]?.history || []);
    const intl = Object.values(yields?.international_10yr || {}).map((c) => c.history || []);
    return [...histories, ...intl];
  }, [yields]);

  const availableDates = useMemo(() => getAvailableYieldDates(allHistories, 90), [allHistories]);
  const lastDate = availableDates[availableDates.length - 1];
  const [range, setRange] = useState({ startDate: lastDate, endDate: lastDate });
  const [sort, setSort] = useState({ key: null, direction: "desc" });

  if (!lastDate) {
    return (
      <div className="text-paper/50 font-body py-16 text-center">
        No yield data yet — run <code className="font-mono text-brass-400">python scripts/fetch_data.py</code>.
      </div>
    );
  }

  const usRows = US_TENORS.map((t) => {
    const history = yields?.[t.key]?.history || [];
    const stats = computeYieldRangeStats(history, range.startDate, range.endDate);
    return { key: t.key, label: t.label, flag: "🇺🇸", url: `/treasury/${t.key}`, monthly: false, stats };
  }).filter((r) => r.stats !== null);

  const intlRows = Object.entries(yields?.international_10yr || {}).map(([market, data]) => {
    const meta = getMarketMeta(market);
    const stats = computeYieldRangeStats(data.history || [], range.startDate, range.endDate);
    return {
      key: market,
      label: `${market} 10-Yr`,
      flag: meta?.iso2,
      url: `/markets/${market}`,
      monthly: true,
      stats,
    };
  }).filter((r) => r.stats !== null);

  const allRows = [...usRows, ...intlRows];

  const getValue = (row, key) => {
    if (key === "label") return row.label;
    if (key === "yield") return row.stats.endYield;
    if (key === "change") return row.stats.changeAbsPts;
    return null;
  };
  const rows = sortRows(allRows, sort, getValue);
  const handleSort = (key) => setSort((cur) => nextSortState(cur, key, key === "label"));

  return (
    <div>
      <RangeSelector availableDates={availableDates} range={range} onChange={setRange} presets={PRESETS} />

      <p className="text-paper/30 text-[11px] font-body mb-3">
        International 10-year yields update monthly (OECD/FRED), so they always show the most
        recently published value regardless of the exact date selected — a short 1-7 day window
        will often show little or no change simply because no new monthly figure has been
        published in that time, not because nothing moved. Use a wider custom range to see real
        movement on those rows.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
            <th className="py-3 pr-4 font-medium w-8">#</th>
            <SortableHeader label="Instrument" sortKey="label" currentSort={sort} onSort={handleSort} />
            <SortableHeader label="Yield" sortKey="yield" currentSort={sort} onSort={handleSort} align="right" />
            <SortableHeader label="Change (window)" sortKey="change" currentSort={sort} onSort={handleSort} align="right" />
            <th className="py-3 pr-4 font-medium text-right">Volume</th>
            <th className="py-3 pr-4 font-medium text-right">Total Outstanding</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((r, i) => {
            const change = r.stats.changeAbsPts;
            const positive = (change ?? 0) >= 0;
            return (
              <tr key={r.key} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors">
                <td className="py-3 pr-4 font-mono text-paper/40">{i + 1}</td>
                <td className="py-3 pr-4">
                  <Link href={r.url} className="flex items-center gap-2 hover:underline">
                    {r.monthly ? <FlagIcon iso2={r.flag} /> : <span>{r.flag}</span>}
                    <span className="text-paper/80 font-body">{r.label}</span>
                    {r.monthly && (
                      <span className="text-paper/30 text-[10px] font-mono">(monthly)</span>
                    )}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right font-mono text-brass-400">
                  {r.stats.endYield != null ? `${r.stats.endYield.toFixed(2)}%` : "—"}
                </td>
                <td className={`py-3 pr-4 text-right font-mono ${positive ? "text-gain" : "text-loss"}`}>
                  {change != null ? `${change > 0 ? "+" : ""}${change.toFixed(2)}pts` : "—"}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-paper/30">$—</td>
                <td className="py-3 pr-4 text-right font-mono text-paper/30">$—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
