import { getMarketData, getMeta } from "../../lib/getMarketData";
import CommoditiesFXPage from "../../components/CommoditiesFXPage";

export const metadata = {
  title: "InfinityVolume — Commodities & FX: Daily Prices, Futures, Crypto & Currency Rates",
  description:
    "Daily price moves, 3-day change, and contract volume for gold, silver, crude oil, natural gas, Bitcoin, Ethereum, Solana, grains, and soft commodities — plus live FX rates for 10 major currencies, all in USD.",
  alternates: { canonical: "/commodities-fx" },
};

export default function CommoditiesFXServerPage() {
  const commoditiesData = getMarketData("_commodities");
  const currenciesData  = getMarketData("_currencies");

  return (
    <CommoditiesFXPage
      commoditiesData={commoditiesData}
      currenciesData={currenciesData}
    />
  );
}
