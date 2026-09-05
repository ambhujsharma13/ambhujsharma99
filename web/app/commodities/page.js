import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";
import AssetTableClient from "../../components/AssetTableClient";

export const metadata = {
  title: "InfinityVolume — Global Commodities: Daily & 3-Day Price Moves (Gold, Silver, Copper, Bitcoin, Grains)",
  description:
    "Daily and rolling 3-day price change for gold, silver, copper, Bitcoin, soybeans, corn, wheat, coffee, sugar, cotton, and cocoa futures, in USD.",
  alternates: { canonical: "/commodities" },
};

export default function CommoditiesPage() {
  const data = getMarketData("_commodities");
  const meta = getMeta();
  const commodities = data?.commodities || {};

  const rows = Object.entries(commodities).map(([symbol, c]) => {
    const latest = c.history?.[c.history.length - 1];
    return {
      key: symbol,
      label: c.name,
      sublabel: c.unit,
      latest: latest || {},
      sparklineData: (c.history || []).slice(-14),
    };
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Commodities
      </nav>

      <h1 className="font-display text-3xl text-paper mb-2">
        Global Commodities — Daily &amp; 3-Day Price Moves (USD)
      </h1>
      <p className="text-paper/50 font-body max-w-2xl mb-6">
        Gold, silver, copper, Bitcoin, and major agricultural futures
        (soybeans, corn, wheat, coffee, sugar, cotton, cocoa), all
        already USD-denominated. Sourced via the CME/CBOT/ICE futures
        family — grain futures are historically quoted in US cents per
        bushel, so double-check the unit shown per row before reading a
        price at face value.
      </p>

      {rows.length > 0 ? (
        <AssetTableClient rows={rows} priceLabel="Price (USD)" assetType="commodity" />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">
          No commodities data yet — run <code className="font-mono text-brass-400">fetch_data.py</code>.
        </p>
      )}

      <p className="text-paper/30 text-xs font-body mt-8">
        {meta?.last_updated_utc && (
          <>Data last updated {new Date(meta.last_updated_utc).toUTCString()}. </>
        )}
        Prices via Yahoo Finance.
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to all markets
        </Link>
      </div>
    </main>
  );
}
