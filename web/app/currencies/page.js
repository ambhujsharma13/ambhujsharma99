import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";
import AssetTableClient from "../../components/AssetTableClient";

export const metadata = {
  title: "InfiniVolume — Major Currency Pairs vs. USD: Daily & 3-Day Moves",
  description:
    "Daily and rolling 3-day exchange rate moves for major currencies against the US dollar — Euro, British Pound, Chinese Yuan, Indian Rupee, Japanese Yen, and more.",
  alternates: { canonical: "/currencies" },
};

export default function CurrenciesPage() {
  const data = getMarketData("_currencies");
  const meta = getMeta();
  const currencies = data?.currencies || {};

  const rows = Object.entries(currencies).map(([ccy, c]) => {
    const latest = c.history?.[c.history.length - 1];
    return {
      key: ccy,
      label: `${ccy} / USD`,
      sublabel: c.label,
      latest: latest || {},
      sparklineData: (c.history || []).slice(-14),
    };
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfiniVolume
        </Link>{" "}
        / Currencies
      </nav>

      <h1 className="font-display text-3xl text-paper mb-2">
        Major Currency Pairs vs. USD — Daily &amp; 3-Day Moves
      </h1>
      <p className="text-paper/50 font-body max-w-2xl mb-6">
        Every rate below is expressed as &quot;1 unit of this currency = $X
        USD&quot; — the same convention used everywhere else on this site —
        rather than mixing FX market quote conventions. This is the exact
        same daily FX data this site already uses to convert every stock
        price into USD, just surfaced directly.
      </p>

      {rows.length > 0 ? (
        <AssetTableClient rows={rows} priceLabel="Rate (USD)" assetType="currency" />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">
          No currency data yet — run <code className="font-mono text-brass-400">fetch_data.py</code>.
        </p>
      )}

      <p className="text-paper/30 text-xs font-body mt-8">
        {meta?.last_updated_utc && (
          <>Data last updated {new Date(meta.last_updated_utc).toUTCString()}. </>
        )}
        FX rates via the ECB reference rates (Frankfurter API).
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to all markets
        </Link>
      </div>
    </main>
  );
}
