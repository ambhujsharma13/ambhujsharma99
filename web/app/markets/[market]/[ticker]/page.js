import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKETS, getMarketMeta, formatUsd, formatPct } from "../../../../lib/markets";
import { getMarketData } from "../../../../lib/getMarketData";
import CompanyLogo from "../../../../components/CompanyLogo";
import TickerChart from "../../../../components/TickerChart";
import FlagIcon from "../../../../components/FlagIcon";

// Every ticker across every (available) market gets its own static page —
// enumerated here from the actual fetched data, so this always matches
// whatever's really in tickers.json rather than a separately maintained list.
export function generateStaticParams() {
  const params = [];
  for (const m of MARKETS.filter((m) => !m.unavailable)) {
    const data = getMarketData(m.key);
    if (!data) continue;
    for (const symbol of Object.keys(data.tickers)) {
      if (symbol.startsWith("__name__")) continue;
      params.push({ market: m.key, ticker: symbol });
    }
  }
  return params;
}

function getTickerInfo(market, ticker) {
  const data = getMarketData(market);
  if (!data) return null;
  const history = data.tickers[ticker];
  const name = data.tickers[`__name__${ticker}`];
  if (!history) return null;
  return { history, name: name || ticker };
}

export async function generateMetadata({ params }) {
  const { market, ticker } = await params;
  const meta = getMarketMeta(market);
  const info = getTickerInfo(market, decodeURIComponent(ticker));
  if (!meta || !info) return {};
  const title = `${info.name} (${ticker}) — Price, Volume & Turnover History — InfiniVolume`;
  const description = `Historical daily price and dollar volume for ${info.name} (${ticker}), converted to USD, on InfiniVolume.`;
  return { title, description, alternates: { canonical: `/markets/${market}/${ticker}` } };
}

export default async function TickerPage({ params }) {
  const { market, ticker: rawTicker } = await params;
  const ticker = decodeURIComponent(rawTicker);
  const meta = getMarketMeta(market);
  if (!meta || meta.unavailable) notFound();

  const info = getTickerInfo(market, ticker);
  if (!info) notFound();

  const { history, name } = info;
  const latest = history[history.length - 1];
  const earliest = history[0];
  const fullRangeChangePct = earliest?.close_usd
    ? (latest.close_usd / earliest.close_usd - 1) * 100
    : null;

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfiniVolume
        </Link>{" "}
        / <Link href={`/markets/${market}`} className="hover:text-brass-400">{meta.label}</Link> / {ticker}
      </nav>

      <div className="flex items-center gap-4 mb-2">
        <CompanyLogo symbol={ticker} name={name} size={48} />
        <div>
          <h1 className="font-display text-2xl text-paper">{name}</h1>
          <div className="flex items-center gap-2 text-paper/50 font-mono text-sm">
            <FlagIcon iso2={meta.iso2} /> {ticker} · {meta.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Latest Close</div>
          <div className="font-mono text-lg text-brass-400 mt-1">
            {formatUsd(latest.close_usd, { compact: false })}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">1-Day Change</div>
          <div
            className={`font-mono text-lg mt-1 ${(latest.daily_change_pct ?? 0) >= 0 ? "text-gain" : "text-loss"}`}
          >
            {formatPct(latest.daily_change_pct)}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Market Cap</div>
          <div className="font-mono text-lg text-paper/80 mt-1">{formatUsd(latest.market_cap_usd)}</div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">
            Change (full history shown)
          </div>
          <div className={`font-mono text-lg mt-1 ${(fullRangeChangePct ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>
            {formatPct(fullRangeChangePct)}
          </div>
        </div>
      </div>

      <TickerChart history={history} />

      <div className="mt-8 border border-ink-700 rounded-lg p-5 bg-ink-900/50">
        <p className="text-paper/50 font-body text-sm leading-relaxed">
          More here soon — company profile, news, fundamentals, and
          peer comparisons, sourced from an external data provider once
          that&apos;s wired in. For now this page shows the same daily
          price/volume history already powering the {meta.label} table.
        </p>
      </div>

      <div className="mt-6">
        <Link href={`/markets/${market}`} className="text-brass-400 text-sm font-body hover:underline">
          ← Back to {meta.label}
        </Link>
      </div>
    </main>
  );
}
