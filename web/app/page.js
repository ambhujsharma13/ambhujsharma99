import { MARKETS, getMarketMeta } from "../lib/markets";
import { getMarketData, getAllMarketsData, getMeta } from "../lib/getMarketData";
import TickerTape from "../components/TickerTape";
import LeftColumn from "../components/LeftColumn";
import RightColumn from "../components/RightColumn";
import MarketDashboardContent from "../components/MarketDashboardContent";
import FixedIncomeTable from "../components/FixedIncomeTable";
import TopETFsTable from "../components/TopETFsTable";

export const metadata = {
  title: "InfinityVolume — Daily Stock Volume & Price Across 15 Markets, in USD",
  description:
    "Daily and rolling 3-day price, dollar volume, market cap, and turnover ratio for the most actively traded stocks across 15 global markets — all converted to USD, updating around the clock across time zones.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const usMeta = getMarketMeta("US");
  const data = getMarketData("US");
  const siteMeta = getMeta();
  const treasuryYields = getMarketData("_treasury_yields"); // homepage-only, see note below
  const etfData = getMarketData("_etfs"); // homepage-only, same as treasury yields

  const availableMarkets = MARKETS.filter((m) => !m.unavailable);
  const dataByMarket = getAllMarketsData(availableMarkets.map((m) => m.key));
  const tickerTapeItems = [];
  for (const m of availableMarkets) {
    const market = dataByMarket[m.key];
    if (!market) continue;
    for (const [symbol, history] of Object.entries(market.tickers)) {
      if (symbol.startsWith("__")) continue;
      const latest = history[history.length - 1];
      if (!latest) continue;
      tickerTapeItems.push({ ...latest, symbol, flag: m.flag });
    }
  }
  tickerTapeItems.sort((a, b) => (b.dollar_volume_usd ?? 0) - (a.dollar_volume_usd ?? 0));

  return (
    <main className="max-w-7xl mx-auto">
      <TickerTape items={tickerTapeItems.slice(0, 20)} />

      <div className="px-6 py-10">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
          <p className="text-paper/40 text-xs font-mono tracking-wide">
            global market volume, always on — somewhere, a market is open right now
          </p>
          <div className="font-mono text-xs text-paper/40">
            {siteMeta ? (
              <>last updated {new Date(siteMeta.last_updated_utc).toUTCString()}</>
            ) : (
              <>no data yet</>
            )}
          </div>
        </div>

        {/* Three columns: Discussions + country sidebar on the left, main
            dashboard content in the center, Top Stories on the right.
            The Treasury/ETF snapshot tables are passed in as `children`
            here — homepage-only, per your call — MarketDashboardContent
            itself doesn't render them on its own, so market pages stay
            plain. */}
        <div className="flex gap-6">
          <LeftColumn activeKey="US" />
          <MarketDashboardContent meta={usMeta} data={data} siteMeta={siteMeta}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <FixedIncomeTable yields={treasuryYields} />
              <TopETFsTable data={etfData} />
            </div>
          </MarketDashboardContent>
          <RightColumn />
        </div>
      </div>
    </main>
  );
}
