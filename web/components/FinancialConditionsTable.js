"use client";

import { useState } from "react";
import Link from "next/link";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";

const INDICATORS = [
  {
    key: "m2_supply",
    label: "M2 Money Supply",
    format: "trillions",
    description: "Cash, checking deposits, and savings circulating through the economy.",
  },
  {
    key: "fed_balance_sheet",
    label: "Fed Balance Sheet",
    format: "trillions",
    description: "Total assets the Federal Reserve holds, mainly Treasury and mortgage bonds.",
  },
  {
    key: "bank_credit",
    label: "Total Bank Credit",
    format: "trillions",
    description: "Total loans and securities held by all US commercial banks.",
  },
  {
    key: "financial_conditions_index",
    label: "Chicago Fed Financial Conditions Index",
    format: "index",
    description: "Measures how loose or tight financial conditions are versus history.",
  },
  {
    key: "yield_curve_10y2y",
    label: "10Y-2Y Treasury Yield Spread",
    format: "points",
    description: "Gap between long and short-term Treasury yields; often predicts recessions.",
  },
  {
    key: "fed_funds_rate",
    label: "Effective Fed Funds Rate",
    format: "points",
    description: "The interest rate banks charge each other for overnight loans.",
  },
  {
    key: "high_yield_spread",
    label: "High-Yield Credit Spread (ICE BofA)",
    format: "points",
    description: "Extra yield investors demand to hold risky corporate debt over Treasuries.",
  },
];

function formatValue(value, format) {
  if (value == null) return "—";
  if (format === "trillions") return `$${value.toFixed(2)}Tn`;
  if (format === "points") return `${value.toFixed(2)}%`;
  return value.toFixed(3);
}

// Two different clamp ranges per change type — 1-month moves are
// naturally smaller in magnitude than 1-year moves, so using the same
// clamp for both would make every 1-month bar look tiny and every 1-year
// bar pinned to the edges. These ranges are reasonable starting points,
// not scientifically calibrated — worth revisiting once real data has
// been observed for a while.
const CLAMP = {
  mom: { dollar: 3, rate: 0.3 },
  yoy: { dollar: 10, rate: 1.5 },
};

function GradientMeter({ value, isDollar, period }) {
  if (value == null) return <span className="text-paper/30 text-xs">—</span>;
  const clamp = isDollar ? CLAMP[period].dollar : CLAMP[period].rate;
  const clamped = Math.max(-clamp, Math.min(clamp, value));
  const position = ((clamped + clamp) / (2 * clamp)) * 100;
  const positive = value >= 0;
  const display = isDollar ? `${positive ? "+" : ""}${value.toFixed(2)}%` : `${positive ? "+" : ""}${value.toFixed(2)}pts`;

  return (
    <div className="inline-block w-24">
      <div className={`text-xs font-mono text-right mb-1 ${positive ? "text-gain" : "text-loss"}`}>
        {display}
      </div>
      <div className="relative h-1 rounded-full bg-gradient-to-r from-loss via-brass-500 to-gain">
        <div
          className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-paper border border-ink-950 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
    </div>
  );
}

export default function FinancialConditionsTable({ data }) {
  const [sort, setSort] = useState({ key: null, direction: "desc" });

  if (!data) {
    return (
      <p className="text-paper/40 font-body py-16 text-center">
        No data yet — run <code className="font-mono text-brass-400">python scripts/fetch_data.py</code>.
      </p>
    );
  }

  const allRows = INDICATORS.map((ind) => ({ ...ind, item: data[ind.key] }));

  const getValue = (row, key) => {
    if (key === "label") return row.label;
    if (key === "value") return row.item?.value;
    const isDollar = row.format === "trillions";
    if (key === "mom") return isDollar ? row.item?.mom_change_pct : row.item?.mom_change_abs;
    if (key === "yoy") return isDollar ? row.item?.yoy_change_pct : row.item?.yoy_change_abs;
    return null;
  };
  const rows = sortRows(allRows, sort, getValue);
  const handleSort = (key) => setSort((cur) => nextSortState(cur, key, key === "label"));

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-paper/50 font-body text-xs uppercase tracking-wide border-b border-ink-700">
          <th className="py-3 pr-4 font-medium w-8">#</th>
          <SortableHeader label="Indicator" sortKey="label" currentSort={sort} onSort={handleSort} />
          <SortableHeader label="Current" sortKey="value" currentSort={sort} onSort={handleSort} align="right" />
          <SortableHeader label="1-Month Change" sortKey="mom" currentSort={sort} onSort={handleSort} align="right" />
          <SortableHeader label="1-Year Change" sortKey="yoy" currentSort={sort} onSort={handleSort} align="right" />
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((row, i) => {
          const isDollar = row.format === "trillions";
          const momValue = isDollar ? row.item?.mom_change_pct : row.item?.mom_change_abs;
          const yoyValue = isDollar ? row.item?.yoy_change_pct : row.item?.yoy_change_abs;
          return (
            <tr key={row.key} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors align-top">
              <td className="py-3 pr-4 font-mono text-paper/40">{i + 1}</td>
              <td className="py-3 pr-4">
                <Link href={`/indicator/${row.key}`} className="text-paper/80 font-body hover:underline">
                  {row.label}
                </Link>
                <div className="text-paper/35 text-[11px] font-body mt-0.5 max-w-xs">{row.description}</div>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-brass-400 whitespace-nowrap">
                {formatValue(row.item?.value, row.format)}
              </td>
              <td className="py-3 pr-4 text-right">
                <GradientMeter value={momValue} isDollar={isDollar} period="mom" />
              </td>
              <td className="py-3 pr-4 text-right">
                <GradientMeter value={yoyValue} isDollar={isDollar} period="yoy" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
