// Field names match exactly what's actually stored in each market's
// JSON data file (confirmed directly from a real sample: close_usd,
// dollar_volume_usd, volume_shares, daily_change_pct,
// rolling_3d_change_pct, rolling_3d_dollar_volume_usd, market_cap_usd,
// turnover_daily_pct, turnover_3d_pct — nothing here is guessed).
//
// "price" and "volume" are always shown and aren't part of this
// optional list — everything below is what a user can additionally
// choose to display, persisted per-watchlist via visible_columns.
export const AVAILABLE_COLUMNS = [
  { key: "shares_volume", field: "volume_shares", label: "Shares Volume", format: "number" },
  { key: "daily_change", field: "daily_change_pct", label: "Daily Change %", format: "percent" },
  { key: "rolling_3d_change", field: "rolling_3d_change_pct", label: "3-Day Change %", format: "percent" },
  { key: "rolling_3d_volume", field: "rolling_3d_dollar_volume_usd", label: "3-Day Volume", format: "usd_compact" },
  { key: "market_cap", field: "market_cap_usd", label: "Market Cap", format: "usd_compact" },
  { key: "turnover_daily", field: "turnover_daily_pct", label: "Daily Turnover %", format: "percent" },
  { key: "turnover_3d", field: "turnover_3d_pct", label: "3-Day Turnover %", format: "percent" },
];

export function formatColumnValue(value, format) {
  if (value == null) return "—";
  if (format === "percent") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  if (format === "number") return value.toLocaleString();
  if (format === "usd_compact") {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  }
  return String(value);
}
