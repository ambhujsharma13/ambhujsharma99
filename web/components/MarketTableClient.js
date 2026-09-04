"use client";

import { useState, useMemo } from "react";
import DataTable from "./DataTable";
import DateRangeSelector from "./DateRangeSelector";
import { getAvailableDates } from "../lib/rangeStats";

export default function MarketTableClient({ tickers, marketKey }) {
  const availableDates = useMemo(() => getAvailableDates(tickers, 15), [tickers]);
  const lastDate = availableDates[availableDates.length - 1];

  const [range, setRange] = useState({ startDate: lastDate, endDate: lastDate });

  if (!lastDate) {
    return (
      <div className="text-paper/50 font-body py-16 text-center">
        No data yet — run <code className="font-mono text-brass-400">python scripts/fetch_data.py</code> to populate it.
      </div>
    );
  }

  return (
    <div>
      <DateRangeSelector availableDates={availableDates} range={range} onChange={setRange} />
      <DataTable tickers={tickers} range={range} marketKey={marketKey} />
    </div>
  );
}
