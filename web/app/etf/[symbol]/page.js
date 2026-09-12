import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketData } from "../../../lib/getMarketData";
import SimpleLineChart from "../../../components/SimpleLineChart";
import KeyStatsTable from "../../../components/KeyStatsTable";

function formatUsdCompact(value) {
  if (value == null) return "$—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export function generateStaticParams() {
  const data = getMarketData("_etfs");
  return Object.keys(data?.etfs || {}).map((symbol) => ({ symbol }));
}

function getEtf(symbol) {
  const data = getMarketData("_etfs");
  return data?.etfs?.[symbol] || null;
}

export async function generateMetadata({ params }) {
  const { symbol } = await params;
  const etf = getEtf(symbol);
  if (!etf) return {};
  return {
    title: `${symbol} (${etf.name}) — Price, Volume & AUM History — InfinityVolume`,
    description: `Historical daily price and volume for ${etf.name} (${symbol}), plus AUM, sourced from Yahoo Finance.`,
    alternates: { canonical: `/etf/${symbol}` },
  };
}

export default async function EtfPage({ params }) {
  const { symbol } = await params;
  const etf = getEtf(symbol);
  if (!etf) notFound();

  const history = etf.history || [];
  const latest = [...history].reverse().find(r => r.close_usd != null) ?? history[history.length - 1];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / {symbol}
      </nav>

      <h1 className="font-display text-2xl text-paper mb-1">
        {symbol} <span className="text-paper/40 text-lg font-body">{etf.name}</span>
      </h1>
      <p className="text-paper/40 font-mono text-sm mb-6">
        {etf.type} · Source: Yahoo Finance
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Latest Close</div>
          <div className="font-mono text-lg text-brass-400 mt-1">
            {latest ? `$${latest.close_usd.toFixed(2)}` : "—"}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">1-Day Change</div>
          <div
            className={`font-mono text-lg mt-1 ${(latest?.daily_change_pct ?? 0) >= 0 ? "text-gain" : "text-loss"}`}
          >
            {latest?.daily_change_pct != null ? `${latest.daily_change_pct > 0 ? "+" : ""}${latest.daily_change_pct}%` : "—"}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">Volume ($)</div>
          <div className="font-mono text-lg text-paper/80 mt-1">
            {formatUsdCompact(latest?.dollar_volume_usd)}
          </div>
        </div>
        <div className="border border-ink-700 rounded-md p-3 bg-ink-900">
          <div className="text-paper/40 text-xs font-body uppercase tracking-wide">AUM</div>
          <div className="font-mono text-lg text-paper/80 mt-1">{formatUsdCompact(etf.aum_usd)}</div>
        </div>
      </div>

      {history.length > 1 ? (
        <SimpleLineChart data={history} dataKey="close_usd" valuePrefix="$" decimals={2} />
      ) : (
        <p className="text-paper/40 font-body py-16 text-center">Not enough history to chart yet.</p>
      )}

      <div className="mt-6">
        <KeyStatsTable stats={etf} latestVolume={latest?.volume_shares} />
      </div>

      <div className="mt-8 border border-ink-700 rounded-lg p-5 bg-ink-900/50">
        <p className="text-paper/50 font-body text-sm leading-relaxed">
          More here soon — holdings breakdown, expense ratio, and
          comparisons against similar funds, once that data source is
          wired in. For now this shows real daily price, volume, and AUM.
        </p>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
