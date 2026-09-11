import Link from "next/link";

// Combines two otherwise-unrelated data sources into one homepage
// card, per explicit request: FINRA corporate bond market breadth
// (fixed income) and US home sales (real estate). They share a table
// purely by request, not because they're conceptually the same kind
// of market data.
const GAIN_HEX = "#4ADE80";
const LOSS_HEX = "#F87171";

function formatCount(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

// Rounded to the nearest whole billion with a "Bn" suffix, per
// explicit request — distinct from the more general formatUsd used
// elsewhere in this project, which keeps one decimal.
function formatUsdBn(n) {
  if (n == null) return "—";
  return `$${Math.round(n / 1_000_000_000).toLocaleString()}Bn`;
}

// "4.09Mn units" — a plain unit count, no currency sign, per explicit
// request (distinct from the dollar-volume figure shown alongside it).
function formatUnitsMn(n) {
  if (n == null) return "—";
  return `${(n / 1_000_000).toFixed(2)}Mn units`;
}

// Three separate rows — advances, declines, then their ratio — each
// with its own colored heatmap-style background bar, intensity scaled
// by that value's share of advances+declines combined. Hardcoded hex
// values via inline style rather than Tailwind's bg-gain/20-style
// opacity-modifier classes: confirmed via an earlier, separate bug
// (invisible avatar SVGs) that this project's custom color names don't
// reliably generate every Tailwind utility variant, so inline style
// sidesteps that risk entirely for a dynamically-computed intensity.
function HeatmapRow({ label, value, hex, ratio }) {
  const minOpacity = 0.15;
  const maxOpacity = 0.55;
  const opacity = minOpacity + ratio * (maxOpacity - minOpacity);
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-ink-800">
      <span className="text-paper/50 text-xs font-body">{label}</span>
      <span
        className="rounded px-2 py-1 text-xs font-mono text-paper/90"
        style={{ backgroundColor: `${hex}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` }}
      >
        {formatCount(value)}
      </span>
    </div>
  );
}

function BreadthHeatmap({ advances, declines }) {
  const total = (advances || 0) + (declines || 0);
  const advRatio = total > 0 ? advances / total : 0.5;
  const decRatio = total > 0 ? declines / total : 0.5;
  const advDeclineRatio = declines > 0 ? advances / declines : null;

  return (
    <div>
      <HeatmapRow label="Advances" value={advances} hex={GAIN_HEX} ratio={advRatio} />
      <HeatmapRow label="Declines" value={declines} hex={LOSS_HEX} ratio={decRatio} />
      <StatRow label="Advance / Decline ratio" value={advDeclineRatio != null ? advDeclineRatio.toFixed(1) : "—"} />
    </div>
  );
}

function StatRow({ label, value, valueClassName = "text-paper/80" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-ink-800">
      <span className="text-paper/50 text-xs font-body">{label}</span>
      <span className={`text-sm font-mono ${valueClassName}`}>{value}</span>
    </div>
  );
}

export default function MarketActivityTable({ data }) {
  const breadth = data?.corporate_bond_market_breadth;
  const monthly = data?.home_sales_monthly;

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <Link href="/market-activity" className="hover:underline">
          <h2 className="font-display text-base text-paper">Corporate Bonds &amp; Home Sales</h2>
        </Link>
        <span className="text-paper/30 text-[10px] font-body">{data ? "FINRA · FRED" : "Not configured"}</span>
      </div>

      <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-1">Corporate Bond Breadth</p>
      {!breadth ? (
        <p className="text-paper/30 text-xs font-body py-2">No data available yet.</p>
      ) : (
        <div className="mb-4">
          <BreadthHeatmap advances={breadth.advances} declines={breadth.declines} />
        </div>
      )}

      <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-1">US Home Sales (monthly)</p>
      {!monthly ? (
        <p className="text-paper/30 text-xs font-body py-2">No data available yet.</p>
      ) : (
        <div>
          <StatRow label="Units sold" value={formatUnitsMn(monthly.sales_count_annualized)} />
          <StatRow label="Total volume" value={formatUsdBn(monthly.estimated_monthly_volume_usd)} valueClassName="text-brass-400" />
        </div>
      )}

      {data?.fetched_at && (
        <p className="text-paper/30 text-[10px] font-body mt-3">
          Updated {new Date(data.fetched_at).toUTCString()}
        </p>
      )}
    </div>
  );
}
