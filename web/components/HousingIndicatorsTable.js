function formatUnits(n) {
  if (n == null) return "—";
  return `${n.toLocaleString()}K`; // FRED reports HOUST/PERMIT in thousands of units, SAAR
}

export default function HousingIndicatorsTable({ housingStarts, buildingPermits }) {
  if ((!housingStarts || housingStarts.length === 0) && (!buildingPermits || buildingPermits.length === 0)) {
    return <p className="text-paper/30 text-sm font-body py-4">No data available yet.</p>;
  }

  // Building permits precede housing starts in the construction
  // pipeline (a permit is issued before ground is broken), so this
  // table leads with permits, the earlier of the two signals.
  const dates = (buildingPermits || []).map((r) => r.date);
  const startsByDate = Object.fromEntries((housingStarts || []).map((r) => [r.date, r.value]));
  const permitsByDate = Object.fromEntries((buildingPermits || []).map((r) => [r.date, r.value]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-4 font-medium">Month</th>
            <th className="py-2 pr-4 font-medium text-right">Building Permits</th>
            <th className="py-2 pr-4 font-medium text-right">Housing Starts</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {dates.map((date) => (
            <tr key={date} className="border-b border-ink-800">
              <td className="py-2 pr-4 font-body text-paper/80 whitespace-nowrap">{date}</td>
              <td className="py-2 pr-4 text-right font-mono text-brass-400">{formatUnits(permitsByDate[date])}</td>
              <td className="py-2 pr-4 text-right font-mono text-paper/70">{formatUnits(startsByDate[date])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-paper/25 text-[10px] font-body mt-2">
        Seasonally-adjusted annual rate, thousands of units. Both are leading indicators for future home sales —
        permits precede starts, which precede completed, sellable homes.
      </p>
    </div>
  );
}
