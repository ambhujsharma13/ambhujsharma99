import TopStoriesPane from "./TopStoriesPane";
import BroadFinancialConditions from "./BroadFinancialConditions";
import NewsFlash from "./NewsFlash";
import { getMarketData } from "../lib/getMarketData";

export default function RightColumn() {
  // Self-fetched here (same pattern reasoning as the Treasury table) so
  // any page rendering RightColumn gets this automatically, on every
  // page — unlike the homepage-only Fixed Income/ETF tables, this one is
  // meant to appear everywhere per the request.
  const conditions = getMarketData("_broad_financial_conditions");
  const news = getMarketData("_news");

  return (
    <div className="w-52 shrink-0">
      <BroadFinancialConditions data={conditions} />
      <NewsFlash data={news} />
      <TopStoriesPane />
    </div>
  );
}
