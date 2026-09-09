import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { getMarketData } from "../../../lib/getMarketData";
import WatchlistManager from "../../../components/WatchlistManager";
import { AVAILABLE_COLUMNS } from "../../../lib/watchlistColumns";

const TRACKED_MARKETS = [
  "US", "China", "Germany", "France", "UK", "Italy", "Spain",
  "India", "Brazil", "Israel", "Turkey", "Canada", "Korea", "Japan",
];

// Looks up current data for a batch of {symbol, market} pairs, fetching
// each unique market's data file only once regardless of how many
// watchlist items share that market. Pulls every field defined in
// AVAILABLE_COLUMNS (not just price/volume) so any of them can be
// shown once a user opts into that column, without a second data pass.
function enrichWithMarketData(items) {
  const marketsNeeded = [...new Set(items.map((i) => i.market))];
  const marketDataCache = {};
  for (const market of marketsNeeded) {
    marketDataCache[market] = getMarketData(market);
  }

  return items.map((item) => {
    const marketData = marketDataCache[item.market];
    const history = marketData?.tickers?.[item.symbol];
    const name = marketData?.tickers?.[`__name__${item.symbol}`] || item.symbol;
    const latest = Array.isArray(history) && history.length > 0 ? history[history.length - 1] : null;

    const extraFields = {};
    for (const col of AVAILABLE_COLUMNS) {
      extraFields[col.field] = latest?.[col.field] ?? null;
    }

    return {
      ...item,
      name,
      currentPrice: latest?.close_usd ?? null,
      currentVolume: latest?.dollar_volume_usd ?? null,
      dataDate: latest?.date ?? null,
      ...extraFields,
    };
  });
}

export default async function WatchlistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("id, name, created_at, visible_columns")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: items } =
    watchlists && watchlists.length > 0
      ? await supabase
          .from("watchlist_items")
          .select("id, watchlist_id, symbol, market, added_at")
          .in("watchlist_id", watchlists.map((w) => w.id))
      : { data: [] };

  const enrichedItems = enrichWithMarketData(items || []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Watchlists</h1>
      <p className="text-paper/40 font-body text-sm mb-6">
        Create multiple lists and track tickers across any of the 14 markets InfinityVolume covers.
      </p>
      <WatchlistManager
        watchlists={watchlists || []}
        items={enrichedItems}
        availableMarkets={TRACKED_MARKETS}
      />
    </main>
  );
}
