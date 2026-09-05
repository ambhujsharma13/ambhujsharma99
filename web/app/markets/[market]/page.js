import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKETS, getMarketMeta } from "../../../lib/markets";
import { getMarketData, getMeta } from "../../../lib/getMarketData";
import LeftColumn from "../../../components/LeftColumn";
import MarketDashboardContent from "../../../components/MarketDashboardContent";

// Pre-renders one static page per market at build time — this is what
// gives each market a real, independent, crawlable URL like
// /markets/India instead of everything living behind client-side tab
// state on a single page.
export function generateStaticParams() {
  return MARKETS.filter((m) => !m.unavailable).map((m) => ({ market: m.key }));
}

export async function generateMetadata({ params }) {
  const { market } = await params;
  const meta = getMarketMeta(market);
  if (!meta) return {};
  const title = `${meta.label} Stocks: Cumulative Volume, Price & Turnover (USD) — InfinityVolume`;
  const description = `Live dollar volume, price change, market cap, and turnover ratio for ${meta.label}'s most actively traded stocks over any date or date range in the last 15 days, all converted to USD.`;
  // US content is canonically "/" now (that's the new default landing
  // page) — /markets/US still renders (see generateStaticParams above,
  // and the note on why below), but tells search engines the real,
  // preferred URL is the homepage rather than treating this as duplicate content.
  const canonical = meta.key === "US" ? "/" : `/markets/${meta.key}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website" },
  };
}

export default async function MarketPage({ params }) {
  const { market } = await params;
  const meta = getMarketMeta(market);
  if (!meta || meta.unavailable) notFound();

  const data = getMarketData(market);
  const siteMeta = getMeta();

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / {meta.label}
      </nav>

      <div className="flex gap-6">
        <LeftColumn activeKey={meta.key} />
        <MarketDashboardContent meta={meta} data={data} siteMeta={siteMeta} />
      </div>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
