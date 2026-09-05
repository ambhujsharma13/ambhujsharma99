import { MARKETS, getMarketMeta } from "../lib/markets";
import { getMarketData, getAllMarketsData, getMeta } from "../lib/getMarketData";
import TickerTape from "../components/TickerTape";
import LeftColumn from "../components/LeftColumn";
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

  const availableMarkets = MARKETS.filter((m) => !m.unavailable);
  const dataByMarket = getAllMarketsData(availableMarkets.map((m) => m.key));
  const tickerTapeItems = [];
  for (const m of availableMarkets) {
    const market = dataByMarket[m.key];
    if (!market) continue;
    for (const [symbol, history] of Object.entries(market.tickers)) {
      if (symbol.startsWith("__name__")) continue;
      const latest = history[history.length - 1];
      if (!latest) continue;
      tickerTapeItems.push({ ...latest, symbol, flag: m.flag });
    }
  }
  tickerTapeItems.sort((a, b) => (b.dollar_volume_usd ?? 0) - (a.dollar_volume_usd ?? 0));
  const treasuryYields = getMarketData("_treasury_yields");

  return (
    <main className="max-w-6xl mx-auto">
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

        <div className="flex gap-6">
          <LeftColumn activeKey="US" />
          <MarketDashboardContent meta={usMeta} data={data} siteMeta={siteMeta}>
            {/* Home-page-only snapshot tables, Truflation-style side-by-side
                compact panels — sit below Top Stories, above the main US
                equity table. Structure-only for now (see the two
                component files) pending your EODHD subscription. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <FixedIncomeTable yields={treasuryYields} />
              <TopETFsTable />
            </div>
          </MarketDashboardContent>
        </div>
      </div>

      <footer className="px-6 py-8 text-paper/30 text-xs font-body border-t border-ink-800 mt-4">
        Prices via Yahoo Finance, FX via ECB reference rates (Frankfurter
        API), GDP via the World Bank Open Data API. Data updates
        automatically once a day via GitHub Actions, plus live prices every
        2 minutes where configured.
      </footer>
    </main>
  );
}
