"use client";

import Sparkline from "./Sparkline";
import { formatPct } from "../lib/markets";

function formatPrice(latest, assetType) {
  if (assetType === "currency") {
    const v = latest.usd_rate;
    if (v === null || v === undefined) return "—";
    return `$${v.toFixed(v < 1 ? 6 : 4)}`;
  }
  // commodity
  const v = latest.close_usd;
  if (v === null || v === undefined) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Shared table for commodities and currency pairs — simpler than the stock
 * DataTable since neither has a market cap or turnover ratio. `rows` is a
 * pre-shaped array: [{ key, label, sublabel, latest, sparklineData }].
 * `assetType` ("commodity" | "currency") controls price formatting and
 * which field feeds the sparkline — kept as a plain string rather than a
 * formatter function, since functions can't cross the server-to-client
 * component boundary in the App Router.
 */
export default function SimpleAssetTable({ rows, priceLabel, view, assetType = "commodity" }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-paper/50 font-body py-16 text-center">
        No data yet. Run <code className="font-mono text-brass-400">python scripts/fetch_data.py</code> to populate it.
      </div>
    );
  }

  const sparklineKey = assetType === "currency" ? "usd_rate" : "close_usd";
  const changeKey = view === "daily" ? "daily_change_pct" : "rolling_3d_change_pct";
  const changeLabel = view === "daily" ? "Change (1d)" : "Change (3d)";

  const sorted = [...rows].sort(
    (a, b) => Math.abs(b.latest[changeKey] ?? 0) - Math.abs(a.latest[changeKey] ?? 0)
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
          <th className="py-3 pr-4 font-medium w-8">#</th>
          <th className="py-3 pr-4 font-medium">Name</th>
          <th className="py-3 pr-4 font-medium text-right">{priceLabel}</th>
          <th className="py-3 pr-4 font-medium text-right">{changeLabel}</th>
          <th className="py-3 pr-4 font-medium">Trend</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {sorted.map((r, i) => {
          const change = r.latest[changeKey];
          const positive = (change ?? 0) >= 0;
          return (
            <tr key={r.key} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors">
              <td className="py-3 pr-4 font-mono text-paper/40">{i + 1}</td>
              <td className="py-3 pr-4">
                <div className="font-mono text-brass-400">{r.label}</div>
                {r.sublabel && <div className="text-paper/50 text-xs font-body">{r.sublabel}</div>}
              </td>
              <td className="py-3 pr-4 text-right font-mono">{formatPrice(r.latest, assetType)}</td>
              <td className={`py-3 pr-4 text-right font-mono ${positive ? "text-gain" : "text-loss"}`}>
                {formatPct(change)}
              </td>
              <td className="py-3 pr-4">
                <Sparkline data={r.sparklineData} positive={positive} dataKey={sparklineKey} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
