import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketData, getMeta } from "../../../lib/getMarketData";
import SimpleLineChart from "../../../components/SimpleLineChart";

const TENORS = {
  "10yr": "US 10-Year Treasury",
  "5yr": "US 5-Year Treasury",
  "2yr": "US 2-Year Treasury",
  "1yr": "US 1-Year Treasury",
  "3mo": "US 3-Month Treasury",
};

export function generateStaticParams() {
  return Object.keys(TENORS).map((tenor) => ({ tenor }));
}

export async function generateMetadata({ params }) {
  const { tenor } = await params;
  const label = TENORS[tenor];
  if (!label) return {};
  return {
    title: `${label} Yield History — InfinityVolume`,
    description: `Historical daily yield for the ${label}, sourced from FRED.`,
    alternates: { canonical: `/treasury/${tenor}` },
  };
}

export default async function TreasuryTenorPage({ params }) {
  const { tenor } = await params;
  const label = TENORS[tenor];
  if (!label) notFound();

  const yields = getMarketData("_treasury_yields");
  const item = yields?.[tenor];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / {label}
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">🇺🇸 {label}</h1>
      <p className="text-paper/40 font-mono text-sm mb-6">Source: FRED</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Latest Yield</div>
          <div className="font-mono text-lg text-brass-400 mt-1">
            {item?.yield_pct != null ? `${item.yield_pct.toFixed(2)}%` : "—"}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">As Of</div>
          <div className="font-mono text-lg text-paper/80 mt-1">{item?.date || "—"}</div>
        </div>
      </div>

      {item?.history?.length > 1 ? (
        <SimpleLineChart data={item.history} dataKey="yield_pct" valueSuffix="%" decimals={2} />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">Not enough history to chart yet.</p>
      )}

      <div className="mt-8 border border-ink-700 rounded-lg p-5 bg-ink-900/50">
        <p className="text-paper/50 font-body text-sm leading-relaxed">
          More context coming soon — auction schedule, yield curve
          comparison across all five tenors, and analyst commentary once
          that content pipeline is live. For now this shows the actual
          daily yield history from FRED.
        </p>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
