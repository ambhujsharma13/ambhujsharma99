"use client";

import { formatPct, formatUsd } from "../lib/markets";

/**
 * A continuously scrolling strip of the day's biggest dollar-volume names
 * across every market — the "departures board" signature moment for the
 * page. Pure CSS marquee (duplicated content, translateX keyframe) so it
 * costs nothing at runtime and respects prefers-reduced-motion.
 */
export default function TickerTape({ items }) {
  if (!items || items.length === 0) return null;

  const renderItem = (item, i) => (
    <span key={i} className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
      <span className="text-brass-400 font-mono text-xs">{item.flag}</span>
      <span className="font-mono text-sm text-paper/90">{item.symbol}</span>
      <span className="font-mono text-sm text-paper/60">{formatUsd(item.dollar_volume_usd)}</span>
      <span
        className={`font-mono text-sm ${
          item.daily_change_pct >= 0 ? "text-gain" : "text-loss"
        }`}
      >
        {formatPct(item.daily_change_pct)}
      </span>
      <span className="text-ink-600">/</span>
    </span>
  );

  return (
    <div className="border-y border-ink-700 bg-ink-900 overflow-hidden py-3 motion-reduce:overflow-x-auto">
      <div className="flex animate-[ticker_60s_linear_infinite] motion-reduce:animate-none w-max">
        {items.map(renderItem)}
        {items.map((item, i) => renderItem(item, `dup-${i}`))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
