import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketData } from "../../../lib/getMarketData";
import SimpleLineChart from "../../../components/SimpleLineChart";

const INDICATORS = {
  m2_supply: { label: "M2 Money Supply", source: "FRED (series: M2SL)" },
  fed_balance_sheet: { label: "Fed Balance Sheet", source: "FRED (series: WALCL)" },
  bank_credit: { label: "Total Bank Credit", source: "FRED (series: TOTBKCR)" },
};

export function generateStaticParams() {
  return Object.keys(INDICATORS).map((key) => ({ key }));
}

export async function generateMetadata({ params }) {
  const { key } = await params;
  const meta = INDICATORS[key];
  if (!meta) return {};
  return {
    title: `${meta.label} History — InfinityVolume`,
    description: `Historical data for ${meta.label}, sourced from ${meta.source}.`,
    alternates: { canonical: `/indicator/${key}` },
  };
}

export default async function IndicatorPage({ params }) {
  const { key } = await params;
  const meta = INDICATORS[key];
  if (!meta) notFound();

  const conditions = getMarketData("_broad_financial_conditions");
  const item = conditions?.[key];

  const yoy = item?.yoy_change_pct;
  const readLabel =
    yoy == null ? "—" : yoy > 1 ? `Loosening (+${yoy}%)` : yoy < -1 ? `Tightening (${yoy}%)` : `Flat (${yoy}%)`;
  const readColor = yoy == null ? "text-paper/40" : yoy > 1 ? "text-gain" : yoy < -1 ? "text-loss" : "text-brass-400";

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / {meta.label}
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">{meta.label}</h1>
      <p className="text-paper/40 font-mono text-sm mb-6">Source: {meta.source}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Latest</div>
          <div className="font-mono text-lg text-brass-400 mt-1">
            {item?.trillions != null ? `$${item.trillions.toFixed(2)}Tn` : "—"}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">YoY Change</div>
          <div className={`font-mono text-lg mt-1 ${readColor}`}>{readLabel}</div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">As Of</div>
          <div className="font-mono text-lg text-paper/80 mt-1">{item?.date || "—"}</div>
        </div>
      </div>

      {item?.history?.length > 1 ? (
        <SimpleLineChart data={item.history} dataKey="trillions" valuePrefix="$" valueSuffix="Tn" decimals={2} />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">Not enough history to chart yet.</p>
      )}

      <div className="mt-8 border border-ink-700 rounded-lg p-5 bg-ink-900/50">
        <p className="text-paper/50 font-body text-sm leading-relaxed">
          More context coming soon — how this indicator relates to the
          other two, and analyst commentary once that content pipeline is
          live. For now this shows the real historical series from FRED.
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
