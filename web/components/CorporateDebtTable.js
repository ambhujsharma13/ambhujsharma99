// FINRA TRACE secondary-market trading activity for corporate and
// agency bonds — explicitly NOT new issuance (FINRA has no primary-
// issuance dataset at all; that's tracked by SIFMA via downloadable
// reports instead of a clean API). Modeled closely on FixedIncomeTable
// (the Treasury yields table) for visual consistency between the two.
const GRADE_ORDER = ["Investment Grade", "High Yield", "Agency"];

function formatVolume(qty) {
  // Units not yet independently confirmed for this dataset the way
  // Treasury's "$ billions" was (see finra_corporate_debt.py docstring)
  // — displayed as a plain formatted count rather than guessing at a
  // dollar-amount scale/label that hasn't been verified.
  if (qty == null) return "—";
  if (qty >= 1_000_000_000) return `${(qty / 1_000_000_000).toFixed(1)}B`;
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(1)}M`;
  if (qty >= 1_000) return `${(qty / 1_000).toFixed(1)}K`;
  return qty.toLocaleString();
}

export default function CorporateDebtTable({ data }) {
  const cappedVolume = data?.capped_volume_by_grade || {};
  const breadth = data?.market_breadth;

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-base text-paper">Corporate Debt Market Activity</h2>
        <span className="text-paper/30 text-[10px] font-body">{data ? "Source: FINRA TRACE" : "Not configured"}</span>
      </div>
      <table className="w-full text-xs table-fixed">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-2 font-medium">Grade</th>
            <th className="py-2 pr-2 font-medium text-right">Trades</th>
            <th className="py-2 pr-2 font-medium text-right">Volume</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {GRADE_ORDER.map((grade) => {
            const row = cappedVolume[grade];
            return (
              <tr key={grade} className="border-b border-ink-800">
                <td className="py-2 pr-2 font-body text-paper/80 whitespace-nowrap">{grade}</td>
                <td className="py-2 pr-2 text-right font-mono text-paper/60">
                  {row?.trade_count != null ? row.trade_count.toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-2 text-right font-mono text-brass-400">{formatVolume(row?.volume_quantity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {breadth && (
        <div className="mt-3 pt-3 border-t border-ink-800 flex items-center justify-between text-xs font-body">
          <span className="text-paper/40">
            Breadth: <span className="text-gain">{breadth.advances} ↑</span>{" "}
            <span className="text-loss">{breadth.declines} ↓</span>{" "}
            <span className="text-paper/50">{breadth.unchanged} flat</span>
          </span>
          <span className="text-paper/30">
            52w: {breadth.fifty_two_week_high}H / {breadth.fifty_two_week_low}L
          </span>
        </div>
      )}

      {data?.fetched_at && (
        <p className="text-paper/30 text-[10px] font-body mt-2">
          Updated {new Date(data.fetched_at).toUTCString()} — secondary-market trading, not new issuance
        </p>
      )}
    </div>
  );
}
