import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";
import EtfRangeTable from "../../components/EtfRangeTable";

export const metadata = {
  title: "All Tracked ETFs by Volume — InfinityVolume",
  description:
    "Full list of tracked ETFs with 1/3/5/7-day and custom range price change, dollar volume, and AUM.",
  alternates: { canonical: "/etfs" },
};

export default function EtfsLandingPage() {
  const data = getMarketData("_etfs");
  const siteMeta = getMeta();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / ETFs
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">All Tracked ETFs</h1>
      <p className="text-paper/50 font-body max-w-2xl mb-6">
        Every ETF tracked on InfinityVolume — this list grows over time. Source: Yahoo Finance.
      </p>

      <EtfRangeTable etfs={data?.etfs} />

      <p className="text-paper/30 text-xs font-body mt-8">
        {siteMeta?.last_updated_utc && (
          <>Data last updated {new Date(siteMeta.last_updated_utc).toUTCString()}. </>
        )}
        Prices and volume via Yahoo Finance; AUM via Yahoo Finance fund data where available.
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
