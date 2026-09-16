import Link from "next/link";

// Credit spreads: IG OAS (BAMLC0A4CBBB) + HY OAS (BAMLH0A0HYM2) via FRED.
// Replaces FINRA corporate bond breadth (requires $1,650/mo Firm credential).
// Visual design matches the Advances/Declines heatmap tiles per explicit request.

const GAIN_HEX = "#4ADE80";  // same as advances green
const LOSS_HEX = "#F87171";  // same as declines red

function fmtBps(value) {
  // FRED stores OAS in percent (e.g. 0.91 = 91 bps). Multiply by 100.
  if (value == null) return "—";
  return `${Math.round(value * 100).toLocaleString()}`;
}

function fmtChangeBps(value) {
  if (value == null) return "—";
  const bps = Math.round(value * 100);
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps}`;
}

function formatUsdBn(n) {
  if (n == null) return "—";
  return `$${Math.round(n / 1_000_000_000).toLocaleString()}Bn`;
}

function formatUnitsMn(n) {
  if (n == null) return "—";
  return `${(n / 1_000_000).toFixed(2)}Mn units`;
}

function StatRow({ label, value, valueClassName = "text-paper/80" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-ink-800">
      <span className="text-paper/50 text-xs font-body">{label}</span>
      <span className={`text-sm font-mono ${valueClassName}`}>{value}</span>
    </div>
  );
}

/**
 * Spread tile — identical visual to Advances/Declines heatmap tiles.
 * Green tile when spread tightening (good), red when widening (bad).
 * Label has hover tooltip with full definition.
 */
function SpreadTileRow({ label, tooltip, value, change1d, change1w }) {
  // Tightening (negative change) = green. Widening (positive) = red.
  const isWider  = change1d != null && change1d > 0;
  const isTighter = change1d != null && change1d < 0;

  const tileHex = isWider ? LOSS_HEX : isTighter ? GAIN_HEX : "#6B7280";

  // Match the exact opacity style from BreadthHeatmap
  const ratio = value == null ? 0.5 : Math.min(1, Math.abs(value) / 10);
  const minOpacity = 0.15;
  const maxOpacity = 0.55;
  const opacity = minOpacity + ratio * (maxOpacity - minOpacity);
  const bgStyle = {
    backgroundColor: `${tileHex}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
  };

  const arrow = isWider ? " ↑" : isTighter ? " ↓" : "";

  const change1dColor = isWider
    ? "text-loss"
    : isTighter
    ? "text-gain"
    : "text-paper/40";

  const change1wIsWider  = change1w != null && change1w > 0;
  const change1wIsTighter = change1w != null && change1w < 0;
  const change1wColor = change1wIsWider
    ? "text-loss"
    : change1wIsTighter
    ? "text-gain"
    : "text-paper/40";

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-ink-800">
      {/* Label with dashed underline + tooltip */}
      <div className="relative group">
        <span className="text-paper/50 text-xs font-body border-b border-dashed border-paper/20 cursor-help">
          {label}
        </span>
        {tooltip && (
          <div className="absolute bottom-full left-0 mb-2 z-20 hidden group-hover:block w-64 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 shadow-2xl pointer-events-none">
            <p className="text-paper/75 text-[11px] font-body leading-relaxed">{tooltip}</p>
          </div>
        )}
      </div>

      {/* Right side: tile + changes */}
      <div className="flex items-center gap-3">
        {/* 1D / 1W changes */}
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-paper/25 font-body">1D</span>
            <span className={`text-[11px] font-mono ${change1dColor}`}>
              {fmtChangeBps(change1d)} bps
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-paper/25 font-body">1W</span>
            <span className={`text-[11px] font-mono ${change1wColor}`}>
              {fmtChangeBps(change1w)} bps
            </span>
          </div>
        </div>

        {/* The colored tile — same size/style as Advances/Declines */}
        <span
          className="rounded px-2 py-1 text-xs font-mono text-paper/90 min-w-[72px] text-center"
          style={bgStyle}
        >
          {fmtBps(value)}{value != null ? " bps" : ""}{arrow}
        </span>
      </div>
    </div>
  );
}

export default function MarketActivityTable({ data }) {
  const ig      = data?.ig_spread;
  const hy      = data?.high_yield_spread;
  const monthly = data?.home_sales_monthly;

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <Link href="/market-activity" className="hover:underline">
          <h2 className="font-display text-base text-paper">Corporate Bonds &amp; Home Sales</h2>
        </Link>
        <span className="text-paper/30 text-[10px] font-body">
          {data ? "FRED · ICE BofA" : "Not configured"}
        </span>
      </div>

      {/* CREDIT SPREADS section */}
      <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-1">
        Corporate Bond Breadth
      </p>

      <SpreadTileRow
        label="IG Spread"
        tooltip="Investment Grade (IG) Option-Adjusted Spread — the premium in yield that investment-grade corporate bonds pay over equivalent US Treasuries. A wider spread signals increased credit risk or market stress. Source: ICE BofA US Corporate Bond Index (BAMLC0A4CBBB) via FRED."
        value={ig?.value}
        change1d={ig?.change_1d_abs}
        change1w={ig?.change_1w_abs}
      />

      <SpreadTileRow
        label="HY Spread"
        tooltip="High Yield (HY) Option-Adjusted Spread — the premium in yield that sub-investment-grade (junk) bonds pay over US Treasuries. Wider spreads reflect higher perceived default risk. Source: ICE BofA US High Yield Master II Index (BAMLH0A0HYM2) via FRED."
        value={hy?.value}
        change1d={hy?.change_1d_abs}
        change1w={hy?.change_1w_abs}
      />

      {/* US HOME SALES section */}
      <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-1 mt-4">
        US Home Sales (monthly)
      </p>
      {!monthly ? (
        <p className="text-paper/30 text-xs font-body py-2">No data available yet.</p>
      ) : (
        <div>
          <StatRow label="Units sold"    value={formatUnitsMn(monthly.sales_count_annualized)} />
          <StatRow label="Total volume"  value={formatUsdBn(monthly.estimated_monthly_volume_usd)} valueClassName="text-brass-400" />
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
