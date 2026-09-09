"use client";

import { useState, useTransition } from "react";
import {
  createWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} from "../lib/watchlist-actions";

function formatUsdCompact(value) {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

function NewWatchlistForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createWatchlist(name);
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-8">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New watchlist name (e.g. Semiconductor Plays)"
        className="flex-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-paper text-sm font-body focus:outline-none focus:border-brass-400"
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-ink-950 bg-brass-400 text-sm font-body font-medium rounded-md px-4 py-2 hover:bg-brass-300 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        Create list
      </button>
      {error && <p className="text-loss text-xs font-body">{error}</p>}
    </form>
  );
}

function AddTickerForm({ watchlistId, availableMarkets }) {
  const [symbol, setSymbol] = useState("");
  const [market, setMarket] = useState(availableMarkets[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addWatchlistItem(watchlistId, symbol, market);
      if (result?.error) {
        setError(result.error);
      } else {
        setSymbol("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Ticker symbol"
        className="w-32 bg-ink-800 border border-ink-700 rounded-md px-2 py-1.5 text-paper text-sm font-mono focus:outline-none focus:border-brass-400"
      />
      <select
        value={market}
        onChange={(e) => setMarket(e.target.value)}
        className="bg-ink-800 border border-ink-700 rounded-md px-2 py-1.5 text-paper text-sm font-body"
      >
        {availableMarkets.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="text-brass-400 text-sm font-body border border-ink-700 rounded-md px-3 py-1.5 hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        + Add
      </button>
      {error && <p className="text-loss text-xs font-body">{error}</p>}
    </form>
  );
}

function WatchlistCard({ watchlist, items, availableMarkets }) {
  const [isPending, startTransition] = useTransition();

  function handleDeleteList() {
    if (!window.confirm(`Delete "${watchlist.name}" and everything in it?`)) return;
    startTransition(() => deleteWatchlist(watchlist.id));
  }

  function handleRemoveItem(itemId) {
    startTransition(() => removeWatchlistItem(itemId));
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base text-paper">{watchlist.name}</h2>
        <button
          onClick={handleDeleteList}
          disabled={isPending}
          className="text-loss text-xs font-body hover:underline disabled:opacity-50"
        >
          Delete list
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-paper/30 text-sm font-body">No tickers yet — add one below.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-paper/40 font-body text-xs uppercase tracking-wide border-b border-ink-800">
              <th className="py-2 pr-3 font-medium">Ticker</th>
              <th className="py-2 pr-3 font-medium">Market</th>
              <th className="py-2 pr-3 font-medium text-right">Price</th>
              <th className="py-2 pr-3 font-medium text-right">Volume</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-ink-800/60">
                <td className="py-2 pr-3">
                  <span className="font-mono text-brass-400">{item.symbol}</span>
                  <div className="text-paper/40 text-xs font-body">{item.name}</div>
                </td>
                <td className="py-2 pr-3 text-paper/60 font-body">{item.market}</td>
                <td className="py-2 pr-3 text-right font-mono text-paper/80">
                  {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : "—"}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-paper/60">
                  {formatUsdCompact(item.currentVolume)}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isPending}
                    className="text-paper/30 text-xs font-body hover:text-loss disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddTickerForm watchlistId={watchlist.id} availableMarkets={availableMarkets} />
    </div>
  );
}

export default function WatchlistManager({ watchlists, items, availableMarkets }) {
  return (
    <div>
      <NewWatchlistForm />

      {watchlists.length === 0 ? (
        <p className="text-paper/40 font-body text-sm">
          No watchlists yet — create your first one above.
        </p>
      ) : (
        watchlists.map((watchlist) => (
          <WatchlistCard
            key={watchlist.id}
            watchlist={watchlist}
            items={items.filter((i) => i.watchlist_id === watchlist.id)}
            availableMarkets={availableMarkets}
          />
        ))
      )}
    </div>
  );
}
