"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import RangeSelector from "./RangeSelector";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";
import { computeRangeStats, getAvailableDates } from "../lib/rangeStats";

const PRESETS = [
  { label: "1 Day", days: 1 },
  { label: "3 Day", days: 3 },
  { label: "5 Day", days: 5 },
  { label: "7 Day", days: 7 },
];

function formatUsdCompact(value) {
  if (value == null) return "$—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export default function EtfRangeTable({ etfs }) {
  const tickersShape = useMemo(() => {
    const shape = {};
    for (const [symbol, etf] of Object.entries(etfs || {})) shape[symbol] = etf.history || [];
    return shape;
  }, [etfs]);

  const availableDates = useMemo(() => getAvailableDates(tickersShape, 90), [tickersShape]);
  const lastDate = availableDates[availableDates.length - 1];
  const [range, setRange] = useState({ startDate: lastDate, endDate: lastDate });
  const [sort, setSort] = useState({ key: "volume", direction: "desc" });

  if (!lastDate) {
    return (
      <div className="text-paper/50 font-body py-16 text-center">
        No ETF data yet — run <code className="font-mono text-brass-400">python scripts/fetch_data.py</code>.
      </div>
    );
  }

  const allRows = Object.entries(etfs || {})
    .map(([symbol, etf]) => {
      const stats = computeRangeStats(etf.history || [], range.startDate, range.endDate);
      return { symbol, name: etf.name, type: etf.type, aum: etf.aum_usd, stats };
    })
    .filter((r) => r.stats !== null);

  const getValue = (row, key) => {
    if (key === "symbol") return row.symbol;
    if (key === "name") return row.name;
    if (key === "type") return row.type;
    if (key === "price") return row.stats.endClose;
    if (key === "change") return row.stats.changePct;
    if (key === "volume") return row.stats.cumulativeVolumeUsd;
    if (key === "aum") return row.aum;
    return null;
  };
  const rows = sortRows(allRows, sort, getValue);
  const handleSort = (key) => setSort((cur) => nextSortState(cur, key, key === "symbol" || key === "name" || key === "type"));

  return (
    <div>
      <RangeSelector availableDates={availableDates} range={range} onChange={setRange} presets={PRESETS} />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
            <th className="py-3 pr-4 font-medium w-8">#</th>
            <SortableHeader label="Symbol" sortKey="symbol" currentSort={sort} onSort={handleSort} />
            <SortableHeader label="Name" sortKey="name" currentSort={sort} onSort={handleSort} />
            <SortableHeader label="Type" sortKey="type" currentSort={sort} onSort={handleSort} />
            <SortableHeader label="Price (USD)" sortKey="price" currentSort={sort} onSort={handleSort} align="right" />
            <SortableHeader label="Change" sortKey="change" currentSort={sort} onSort={handleSort} align="right" />
            <SortableHeader label="Volume (window)" sortKey="volume" currentSort={sort} onSort={handleSort} align="right" />
            <SortableHeader label="AUM" sortKey="aum" currentSort={sort} onSort={handleSort} align="right" />
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((r, i) => {
            const positive = (r.stats.changePct ?? 0) >= 0;
            return (
              <tr key={r.symbol} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors">
                <td className="py-3 pr-4 font-mono text-paper/40">{i + 1}</td>
                <td className="py-3 pr-4">
                  <Link href={`/etf/${r.symbol}`} className="font-mono text-brass-400 hover:underline">
                    {r.symbol}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-paper/70 font-body">{r.name}</td>
                <td className="py-3 pr-4 text-paper/50 font-body">{r.type}</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {r.stats.endClose != null ? `$${r.stats.endClose.toFixed(2)}` : "—"}
                </td>
                <td className={`py-3 pr-4 text-right font-mono ${positive ? "text-gain" : "text-loss"}`}>
                  {r.stats.changePct != null
                    ? `${r.stats.changePct > 0 ? "+" : ""}${r.stats.changePct.toFixed(2)}%`
                    : "—"}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatUsdCompact(r.stats.cumulativeVolumeUsd)}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-paper/60">
                  {formatUsdCompact(r.aum)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
