import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";
import TreasuryRangeTable from "../../components/TreasuryRangeTable";

export const metadata = {
  title: "Global Government Bond Yields — US Curve & 13 Countries — InfinityVolume",
  description:
    "The full US Treasury yield curve (3-month to 10-year) plus 10-year government bond yields for 13 other countries, with 1/3/5/7-day and custom range comparisons.",
  alternates: { canonical: "/treasury" },
};

export default function TreasuryLandingPage() {
  const yields = getMarketData("_treasury_yields");
  const siteMeta = getMeta();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Government Bond Yields
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">Global Government Bond Yields</h1>
      <p className="text-paper/50 font-body max-w-2xl mb-6">
        The full US Treasury curve (3-month through 10-year, daily) plus 10-year yields for 13
        other tracked markets (monthly, via FRED&apos;s mirror of OECD data). Source: FRED.
      </p>

      <TreasuryRangeTable yields={yields} />

      <p className="text-paper/30 text-xs font-body mt-8">
        {siteMeta?.last_updated_utc && (
          <>Data last updated {new Date(siteMeta.last_updated_utc).toUTCString()}. </>
        )}
        US yields via FRED (daily), international 10-year yields via FRED&apos;s mirror of OECD
        data (monthly, with reporting lag).
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
