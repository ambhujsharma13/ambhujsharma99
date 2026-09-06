import Link from "next/link";

function formatUsdCompact(value) {
  if (value == null) return "$—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export default function TopETFsTable({ data }) {
  const etfs = data?.etfs || {};

  const rows = Object.entries(etfs)
    .map(([symbol, etf]) => {
      const latest = etf.history?.[etf.history.length - 1];
      return { symbol, type: etf.type, aum: etf.aum_usd, latest };
    })
    .filter((r) => r.latest)
    .sort((a, b) => (b.latest.dollar_volume_usd ?? 0) - (a.latest.dollar_volume_usd ?? 0));

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-base text-paper">Top ETFs by Volume</h2>
        <span className="text-paper/30 text-[10px] font-body">
          {rows.length > 0 ? "Source: Yahoo Finance" : "pending data"}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-paper/40 font-body text-xs py-8 text-center">
          No ETF data yet — run <code className="font-mono text-brass-400">python scripts/etf_data.py</code>.
        </p>
      ) : (
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
              <th className="py-2 pr-2 font-medium w-5">#</th>
              <th className="py-2 pr-2 font-medium">ETF</th>
              <th className="py-2 pr-2 font-medium text-right">Volume</th>
              <th className="py-2 pr-2 font-medium text-right w-14">AUM</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((row, i) => (
              <tr key={row.symbol} className="border-b border-ink-800 hover:bg-ink-800/60 transition-colors">
                <td className="py-2 pr-2 font-mono text-paper/40">{i + 1}</td>
                <td className="py-2 pr-2">
                  <Link href={`/etf/${row.symbol}`} className="group">
                    <span className="font-mono text-brass-400 group-hover:underline">{row.symbol}</span>
                    <div className="text-paper/25 text-[10px] font-body">{row.type}</div>
                  </Link>
                </td>
                <td className="py-2 pr-2 text-right font-mono text-paper/80">
                  {formatUsdCompact(row.latest.dollar_volume_usd)}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-paper/30">
                  {formatUsdCompact(row.aum)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data?.fetched_at && (
        <p className="text-paper/30 text-[10px] font-body mt-2">
          Updated {new Date(data.fetched_at).toUTCString()}
        </p>
      )}
    </div>
  );
}
