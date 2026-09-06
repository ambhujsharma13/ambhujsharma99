import Link from "next/link";

const LABELS = {
  m2_supply: "M2 Money Supply",
  fed_balance_sheet: "Fed Balance Sheet",
  bank_credit: "Total Bank Credit",
};

function formatTrillions(value) {
  return value != null ? `$${value.toFixed(2)}Tn` : "$—";
}

// Maps a single indicator's own YoY % change to a 0–100 marker position
// on its own gradient bar. Clamped to ±10%, well outside any realistic
// annual move for these three series, so the marker stays legible.
function yoyToPosition(yoyPct) {
  if (yoyPct == null) return 50;
  const clamped = Math.max(-10, Math.min(10, yoyPct));
  return ((clamped + 10) / 20) * 100;
}

function readLabel(yoyPct) {
  if (yoyPct == null) return "—";
  if (yoyPct > 1) return `Loosening (+${yoyPct}%)`;
  if (yoyPct < -1) return `Tightening (${yoyPct}%)`;
  return `Flat (${yoyPct > 0 ? "+" : ""}${yoyPct}%)`;
}

function readColor(yoyPct) {
  if (yoyPct == null) return "text-paper/30";
  if (yoyPct > 1) return "text-gain";
  if (yoyPct < -1) return "text-loss";
  return "text-brass-400";
}

export default function BroadFinancialConditions({ data }) {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 mb-4 p-3">
      <h2 className="font-display text-sm text-paper mb-0.5">Broad Financial Conditions</h2>
      <p className="text-paper/30 text-[10px] font-body mb-3">Source: FRED</p>

      <div className="space-y-3">
        {Object.entries(LABELS).map(([key, label]) => {
          const item = data?.[key];
          const yoy = item?.yoy_change_pct;
          const position = yoyToPosition(yoy);
          return (
            <Link href={`/indicator/${key}`} key={key} className="block group">
              <div className="flex items-baseline justify-between">
                <span className="text-paper/60 text-xs font-body group-hover:text-paper/90">
                  {label}
                </span>
                <span className="text-brass-400 text-xs font-mono">
                  {formatTrillions(item?.trillions)}
                </span>
              </div>

              {/* Per-indicator gradient meter — each one reflects only
                  this indicator's own YoY change, not an average. */}
              <div className="relative h-1 rounded-full bg-gradient-to-r from-loss via-brass-500 to-gain mt-1.5">
                <div
                  className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-paper border border-ink-950 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                />
              </div>
              <div className={`text-[10px] font-mono mt-1 ${readColor(yoy)}`}>
                {readLabel(yoy)}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-paper/20 text-[9px] font-body mt-3 pt-2 border-t border-ink-800 leading-relaxed">
        Year-over-year change, each indicator read on its own — not blended
        into a single score.
      </p>
      {data?.fetched_at && (
        <p className="text-paper/20 text-[9px] font-body mt-1">
          Updated {new Date(data.fetched_at).toUTCString()}
        </p>
      )}
    </div>
  );
}
