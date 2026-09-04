export const MARKETS = [
  { key: "US", label: "United States", flag: "🇺🇸", iso2: "us", localCcy: "USD" },
  { key: "China", label: "China", flag: "🇨🇳", iso2: "cn", localCcy: "CNY" },
  { key: "Germany", label: "Germany", flag: "🇩🇪", iso2: "de", localCcy: "EUR" },
  { key: "France", label: "France", flag: "🇫🇷", iso2: "fr", localCcy: "EUR" },
  { key: "UK", label: "United Kingdom", flag: "🇬🇧", iso2: "gb", localCcy: "GBP" },
  { key: "Italy", label: "Italy", flag: "🇮🇹", iso2: "it", localCcy: "EUR" },
  { key: "Spain", label: "Spain", flag: "🇪🇸", iso2: "es", localCcy: "EUR" },
  { key: "India", label: "India", flag: "🇮🇳", iso2: "in", localCcy: "INR" },
  { key: "Brazil", label: "Brazil", flag: "🇧🇷", iso2: "br", localCcy: "BRL" },
  { key: "Russia", label: "Russia", flag: "🇷🇺", iso2: "ru", localCcy: "RUB", unavailable: true },
  { key: "Israel", label: "Israel", flag: "🇮🇱", iso2: "il", localCcy: "ILS" },
  { key: "Turkey", label: "Turkey", flag: "🇹🇷", iso2: "tr", localCcy: "TRY" },
  { key: "Canada", label: "Canada", flag: "🇨🇦", iso2: "ca", localCcy: "CAD" },
  { key: "Korea", label: "South Korea", flag: "🇰🇷", iso2: "kr", localCcy: "KRW" },
  { key: "Japan", label: "Japan", flag: "🇯🇵", iso2: "jp", localCcy: "JPY" },
];

export function getMarketMeta(key) {
  return MARKETS.find((m) => m.key === key);
}

export function formatUsd(value, { compact = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Turnover ratios (daily $ volume / market cap) are typically small
// fractions of a percent, so they need more decimal precision than a
// normal price-change percentage to actually be readable.
export function formatTurnoverPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(3)}%`;
}
