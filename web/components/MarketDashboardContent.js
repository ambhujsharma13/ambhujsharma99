import FlagIcon from "./FlagIcon";
import CountryStatsBar from "./CountryStatsBar";
import MarketTableClient from "./MarketTableClient";
import TopStoriesPane from "./TopStoriesPane";

export default function MarketDashboardContent({ meta, data, siteMeta, children }) {
  return (
    <section className="flex-1 min-w-0">
      <TopStoriesPane />

      {children}

      <h1 className="font-display text-3xl text-paper mb-6 flex items-center gap-3">
        <FlagIcon iso2={meta.iso2} className="text-2xl" /> {meta.label} — Volume, Price &amp;
        Turnover, Any Date or Range
      </h1>

      <CountryStatsBar stats={data?.country_stats} marketLabel={meta.label} />

      {data ? (
        <MarketTableClient tickers={data.tickers} marketKey={meta.key} />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">
          No data available for {meta.label} yet.
        </p>
      )}

      <p className="text-paper/30 text-xs font-body mt-8">
        {siteMeta?.last_updated_utc && (
          <>Data last updated {new Date(siteMeta.last_updated_utc).toUTCString()}. </>
        )}
        Prices via Yahoo Finance, FX via the ECB reference rates (Frankfurter
        API), GDP via the World Bank Open Data API.
      </p>
    </section>
  );
}
