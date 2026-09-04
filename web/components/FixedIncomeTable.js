// Structure-only scaffold — no real bond/rates data source wired up yet
// (planned via EODHD once subscribed). Placeholder rows show the intended
// shape: instrument, volume rank, yield, and total amount outstanding
// (a bond-specific sizing metric, distinct from market cap for equities).
const PLACEHOLDER_ROWS = [
  { instrument: "US 10-Year Treasury", country: "🇺🇸", yield: "4.28%", outstanding: "$—" },
  { instrument: "US 5-Year Treasury", country: "🇺🇸", yield: "3.94%", outstanding: "$—" },
  { instrument: "German 10-Year Bund", country: "🇩🇪", yield: "2.41%", outstanding: "$—" },
  { instrument: "Japanese 10-Year JGB", country: "🇯🇵", yield: "1.12%", outstanding: "$—" },
  { instrument: "UK 10-Year Gilt", country: "🇬🇧", yield: "4.05%", outstanding: "$—" },
];

export default function FixedIncomeTable() {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-base text-paper">Top Fixed Income by Volume</h2>
        <span className="text-paper/30 text-[10px] font-body">structure only — pending EODHD data</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-2 font-medium w-6">#</th>
            <th className="py-2 pr-2 font-medium">Instrument</th>
            <th className="py-2 pr-2 font-medium text-right">Yield</th>
            <th className="py-2 pr-2 font-medium text-right">Total Amount Outstanding</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {PLACEHOLDER_ROWS.map((row, i) => (
            <tr key={row.instrument} className="border-b border-ink-800">
              <td className="py-2 pr-2 font-mono text-paper/40">{i + 1}</td>
              <td className="py-2 pr-2 font-body text-paper/80">
                {row.country} {row.instrument}
              </td>
              <td className="py-2 pr-2 text-right font-mono text-brass-400">{row.yield}</td>
              <td className="py-2 pr-2 text-right font-mono text-paper/40">{row.outstanding}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
