import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import WatchlistManager from "../../../components/WatchlistManager";
import { enrichWithMarketData } from "../../../lib/reportData";

const TRACKED_MARKETS = [
  "US", "China", "Germany", "France", "UK", "Italy", "Spain",
  "India", "Brazil", "Israel", "Turkey", "Canada", "Korea", "Japan",
];

export default async function ReportGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("id, name, created_at, visible_columns, report_title")
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
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Report Generator</h1>
      <p className="text-paper/40 font-body text-sm mb-6">
        Build custom ticker reports across any of the 14 markets InfinityVolume covers — pick your
        columns, add a title, and share them out.
      </p>
      <WatchlistManager
        watchlists={watchlists || []}
        items={enrichedItems}
        availableMarkets={TRACKED_MARKETS}
      />
    </main>
  );
}
