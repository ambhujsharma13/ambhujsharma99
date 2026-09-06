const LABELS = {
  m2_supply: "M2 Money Supply",
  fed_balance_sheet: "Fed Balance Sheet",
  bank_credit: "Total Bank Credit",
};

function formatTrillions(value) {
  return value != null ? `$${value.toFixed(2)}Tn` : "$—";
}

// Maps avg YoY % change to a 0–100 position on the meter bar. Clamped to
// a -10%..+10% range — well outside anything these three indicators
// realistically move in a year, so the marker stays legible rather than
// pinning to an edge for any normal reading.
function conditionToPosition(avgYoy) {
  if (avgYoy == null) return 50;
  const clamped = Math.max(-10, Math.min(10, avgYoy));
  return ((clamped + 10) / 20) * 100;
}

const CONDITION_COLOR = {
  loose: "#4fae8e",
  neutral: "#d9a441",
  tight: "#c96a5a",
};

export default function BroadFinancialConditions({ data }) {
  const position = conditionToPosition(data?.avg_yoy_change_pct);
  const condition = data?.condition;

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 mb-4 p-3">
      <h2 className="font-display text-sm text-paper mb-0.5">Broad Financial Conditions</h2>
      <p className="text-paper/30 text-[10px] font-body mb-3">Source: FRED</p>

      <div className="space-y-2 mb-3">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex items-baseline justify-between">
            <span className="text-paper/60 text-xs font-body">{label}</span>
            <span className="text-brass-400 text-xs font-mono">
              {formatTrillions(data?.[key]?.trillions)}
            </span>
          </div>
        ))}
      </div>

      {/* Loose/tight meter — a simple gradient bar with a marker, rather
          than a full gauge widget, to stay legible at this narrow width. */}
      <div className="pt-2 border-t border-ink-800">
        <div className="flex justify-between text-[9px] font-body text-paper/30 mb-1">
          <span>Tight</span>
          <span>Neutral</span>
          <span>Loose</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-loss via-brass-500 to-gain">
          <div
            className="absolute top-1/2 w-2 h-2 rounded-full bg-paper border border-ink-950 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${position}%` }}
          />
        </div>
        {condition && (
          <p
            className="text-[10px] font-mono mt-1.5 capitalize"
            style={{ color: CONDITION_COLOR[condition] }}
          >
            {condition} ({data.avg_yoy_change_pct > 0 ? "+" : ""}
            {data.avg_yoy_change_pct}% avg YoY)
          </p>
        )}
      </div>
    </div>
  );
}
