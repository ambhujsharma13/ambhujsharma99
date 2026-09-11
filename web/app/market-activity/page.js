import Link from "next/link";
import { getMarketData, getMeta } from "../../lib/getMarketData";

export const metadata = {
  title: "Corporate Bonds & Home Sales — InfinityVolume",
  description:
    "US corporate bond secondary-market trading breadth (advances, declines, 52-week highs/lows) via FINRA TRACE, alongside estimated US existing-home sales volume via FRED.",
  alternates: { canonical: "/market-activity" },
};

function formatCount(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function formatUsdBn(n) {
  if (n == null) return "—";
  return `$${Math.round(n / 1_000_000_000).toLocaleString()}Bn`;
}

function formatUnitsMn(n) {
  if (n == null) return "—";
  return `${(n / 1_000_000).toFixed(2)}Mn units`;
}

function DetailRow({ label, value, valueClassName = "text-paper/90" }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ink-800">
      <span className="text-paper/50 text-sm font-body">{label}</span>
      <span className={`text-sm font-mono ${valueClassName}`}>{value}</span>
    </div>
  );
}

export default function MarketActivityLandingPage() {
  const data = getMarketData("_market_activity");
  const siteMeta = getMeta();
  const breadth = data?.corporate_bond_market_breadth;
  const monthly = data?.home_sales_monthly;

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Corporate Bonds &amp; Home Sales
      </nav>

      <h1 className="font-display text-2xl text-paper mb-2">Corporate Bonds &amp; Home Sales</h1>
      <p className="text-paper/50 font-body max-w-2xl mb-8">
        Two otherwise unrelated data sources shown together on one page, per how this section was
        originally requested — corporate bond secondary-market trading activity, and US home sales.
      </p>

      <section className="mb-10">
        <h2 className="font-display text-lg text-paper mb-1">Corporate Bond Market Breadth</h2>
        <p className="text-paper/40 text-xs font-body mb-4">
          Source: FINRA TRACE. This measures secondary-market trading activity — how much of the
          existing corporate bond market traded hands — not new issuance. FINRA has no
          primary-issuance dataset at all.
        </p>
        {!breadth ? (
          <p className="text-paper/30 text-sm font-body py-4">No data available yet.</p>
        ) : (
          <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
            <DetailRow label="Advances" value={formatCount(breadth.advances)} valueClassName="text-gain" />
            <DetailRow label="Declines" value={formatCount(breadth.declines)} valueClassName="text-loss" />
            <DetailRow label="Unchanged" value={formatCount(breadth.unchanged)} />
            <DetailRow label="Total trades" value={formatCount(breadth.total_trades)} />
            <DetailRow label="Total volume" value={formatCount(breadth.total_volume)} />
            <DetailRow label="52-week highs" value={formatCount(breadth.fifty_two_week_high)} valueClassName="text-gain" />
            <DetailRow label="52-week lows" value={formatCount(breadth.fifty_two_week_low)} valueClassName="text-loss" />
            {breadth.date && <DetailRow label="Trade date" value={breadth.date} />}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-paper mb-1">US Home Sales</h2>
        <p className="text-paper/40 text-xs font-body mb-4">
          Source: FRED (National Association of Realtors, Existing Home Sales). No single source
          publishes total home sales in dollar terms directly — the volume figure below is an
          estimate (units sold × median price), not a directly-published figure. Weekly figures via
          Redfin&apos;s public data are fetched but not yet reliably parseable, so aren&apos;t shown here yet.
        </p>
        {!monthly ? (
          <p className="text-paper/30 text-sm font-body py-4">No data available yet.</p>
        ) : (
          <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
            <DetailRow label="Units sold (annualized rate)" value={formatUnitsMn(monthly.sales_count_annualized)} />
            <DetailRow label="Median sale price" value={monthly.median_price_usd != null ? `$${monthly.median_price_usd.toLocaleString()}` : "—"} />
            <DetailRow label="Estimated monthly volume" value={formatUsdBn(monthly.estimated_monthly_volume_usd)} valueClassName="text-brass-400" />
            {monthly.date && <DetailRow label="As of" value={monthly.date} />}
          </div>
        )}
      </section>

      <p className="text-paper/30 text-xs font-body mt-8">
        {siteMeta?.last_updated_utc && <>Data last updated {new Date(siteMeta.last_updated_utc).toUTCString()}. </>}
        {data?.fetched_at && <>This section last fetched {new Date(data.fetched_at).toUTCString()}.</>}
      </p>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
