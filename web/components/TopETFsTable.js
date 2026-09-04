// Structure-only scaffold — same status as FixedIncomeTable.js. Mixes
// equity and fixed-income ETFs per the request, with AUM (Assets Under
// Management) as the sizing column, analogous to market cap for equities
// or amount outstanding for individual bonds.
const PLACEHOLDER_ROWS = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF", type: "Equity", aum: "$—" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", type: "Equity", aum: "$—" },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", type: "Fixed Income", aum: "$—" },
  { ticker: "AGG", name: "iShares Core US Aggregate Bond ETF", type: "Fixed Income", aum: "$—" },
  { ticker: "GLD", name: "SPDR Gold Shares", type: "Commodity", aum: "$—" },
];

export default function TopETFsTable() {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-base text-paper">Top ETFs by Volume</h2>
        <span className="text-paper/30 text-[10px] font-body">structure only — pending EODHD data</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-2 font-medium w-6">#</th>
            <th className="py-2 pr-2 font-medium">ETF</th>
            <th className="py-2 pr-2 font-medium">Type</th>
            <th className="py-2 pr-2 font-medium text-right">AUM</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {PLACEHOLDER_ROWS.map((row, i) => (
            <tr key={row.ticker} className="border-b border-ink-800">
              <td className="py-2 pr-2 font-mono text-paper/40">{i + 1}</td>
              <td className="py-2 pr-2">
                <span className="font-mono text-brass-400">{row.ticker}</span>{" "}
                <span className="text-paper/50 font-body">{row.name}</span>
              </td>
              <td className="py-2 pr-2 font-body text-paper/50">{row.type}</td>
              <td className="py-2 pr-2 text-right font-mono text-paper/40">{row.aum}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
