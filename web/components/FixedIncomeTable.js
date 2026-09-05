// Scoped to US Treasuries only, by maturity (per your decision — other
// countries' government bond data isn't realistically available for
// free, even via a paid EODHD subscription, since that's a specialized
// fixed-income data niche outside typical equity/ETF API coverage).
const TENORS = [
  { key: "10yr", label: "US 10-Year Treasury" },
  { key: "5yr", label: "US 5-Year Treasury" },
  { key: "2yr", label: "US 2-Year Treasury" },
  { key: "1yr", label: "US 1-Year Treasury" },
  { key: "3mo", label: "US 3-Month Treasury" },
];

export default function FixedIncomeTable({ yields }) {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-base text-paper">US Treasury Yields by Maturity</h2>
        <span className="text-paper/30 text-[10px] font-body">
          {yields ? "yield: live (FRED)" : "yield: FRED_API_KEY not set"} · volume &amp; outstanding: pending FINRA/Treasury API
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-2 font-medium w-6">#</th>
            <th className="py-2 pr-2 font-medium">Instrument</th>
            <th className="py-2 pr-2 font-medium text-right">Yield</th>
            <th className="py-2 pr-2 font-medium text-right">Volume</th>
            <th className="py-2 pr-2 font-medium text-right">Total Amount Outstanding</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {TENORS.map((tenor, i) => {
            const y = yields?.[tenor.key];
            const yieldDisplay =
              y && y.yield_pct != null ? `${y.yield_pct.toFixed(2)}%` : "—";
            return (
              <tr key={tenor.key} className="border-b border-ink-800">
                <td className="py-2 pr-2 font-mono text-paper/40">{i + 1}</td>
                <td className="py-2 pr-2 font-body text-paper/80">🇺🇸 {tenor.label}</td>
                <td className="py-2 pr-2 text-right font-mono text-brass-400">{yieldDisplay}</td>
                <td className="py-2 pr-2 text-right font-mono text-paper/30">$—</td>
                <td className="py-2 pr-2 text-right font-mono text-paper/30">$—</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {yields?.fetched_at && (
        <p className="text-paper/30 text-[10px] font-body mt-2">
          Yields updated {new Date(yields.fetched_at).toUTCString()}
        </p>
      )}
    </div>
  );
}
