import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";
import FinancialConditionsTable from "../../components/FinancialConditionsTable";

export const metadata = {
  title: "Broad Financial Conditions — Full Indicator List — InfinityVolume",
  description:
    "M2 money supply, Fed balance sheet, bank credit, the Chicago Fed financial conditions index, yield curve spread, Fed funds rate, and high-yield credit spread — current values with 1-month and 1-year change.",
  alternates: { canonical: "/financial-conditions" },
};

export default function FinancialConditionsLandingPage() {
  const data = getMarketData("_broad_financial_conditions");
  const siteMeta = getMeta();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Financial Conditions
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">Broad Financial Conditions</h1>
      <p className="text-paper/50 font-body max-w-2xl mb-6">
        Seven macro/liquidity indicators from FRED. Each is read on its own — no blended score.
        Dollar aggregates show percentage change; rates, spreads, and the financial conditions
        index show absolute point change instead, since percentage terms are misleading for values
        that are small, negative, or cross zero.
      </p>

      <FinancialConditionsTable data={data} />

      <p className="text-paper/30 text-xs font-body mt-8">
        {siteMeta?.last_updated_utc && (
          <>Data last updated {new Date(siteMeta.last_updated_utc).toUTCString()}. </>
        )}
        Source: FRED (Federal Reserve Bank of St. Louis).
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
