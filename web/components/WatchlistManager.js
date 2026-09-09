"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
  updateWatchlistColumns,
} from "../lib/watchlist-actions";
import { AVAILABLE_COLUMNS, formatColumnValue } from "../lib/watchlistColumns";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";

function formatUsdCompact(value) {
  return formatColumnValue(value, "usd_compact");
}

// Escapes a value for CSV — wraps in quotes and doubles any internal
// quotes if the value contains a comma, quote, or newline, per the
// standard CSV escaping rule.
function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportWatchlist(watchlist, items, visibleColumns, format) {
  const activeColumns = AVAILABLE_COLUMNS.filter((c) => visibleColumns.includes(c.key));
  const headers = ["Ticker", "Name", "Market", "Price", "Volume", ...activeColumns.map((c) => c.label)];
  const safeName = watchlist.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  if (format === "json") {
    const data = items.map((item) => {
      const row = {
        ticker: item.symbol,
        name: item.name,
        market: item.market,
        price: item.currentPrice,
        volume: item.currentVolume,
      };
      for (const col of activeColumns) row[col.key] = item[col.field];
      return row;
    });
    downloadFile(`${safeName}.json`, JSON.stringify(data, null, 2), "application/json");
    return;
  }

  const rows = items.map((item) => {
    const base = [item.symbol, item.name, item.market, item.currentPrice ?? "", item.currentVolume ?? ""];
    const extra = activeColumns.map((c) => item[c.field] ?? "");
    return [...base, ...extra].map(csvEscape).join(",");
  });
  const csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
  downloadFile(`${safeName}.csv`, csv, "text/csv");
}

function NewWatchlistForm({ onCreated }) {
  const router = useRouter();
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
        onCreated(result.watchlistId); // a newly created list should be the one that's expanded, not buried collapsed among others
        router.refresh();
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

function AddTickerForm({ watchlistId, availableMarkets, onEdited }) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [market, setMarket] = useState(availableMarkets[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await addWatchlistItem(watchlistId, symbol, market);
        if (result?.error) {
          setError(result.error);
        } else {
          setSymbol("");
          onEdited();
          router.refresh();
        }
      } catch (err) {
        console.error("addWatchlistItem call failed:", err);
        setError("Something went wrong — please try again.");
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

function ColumnPicker({ watchlistId, visibleColumns, onEdited }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleColumn(key) {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter((k) => k !== key)
      : [...visibleColumns, key];
    startTransition(async () => {
      await updateWatchlistColumns(watchlistId, next);
      onEdited();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-paper/50 text-xs font-body border border-ink-700 rounded-md px-2.5 py-1 hover:bg-ink-800"
      >
        + Columns
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-ink-800 border border-ink-700 rounded-md shadow-2xl p-2 z-10">
          {AVAILABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-2 py-1.5 text-xs font-body text-paper/70 hover:bg-ink-700 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                disabled={isPending}
                className="accent-brass-400"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistCard({ watchlist, items, availableMarkets, isExpanded, onExpand, onEdited }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState({ key: null, direction: null });
  const visibleColumns = watchlist.visible_columns || [];
  const activeColumns = AVAILABLE_COLUMNS.filter((c) => visibleColumns.includes(c.key));

  // Maps a sort key to the actual comparable value on a row — covers
  // both the always-present base columns and whichever optional
  // columns are currently active, so SortableHeader/sortRows (the same
  // shared component used on the homepage equity table) work here
  // without needing their own row-shape knowledge.
  function getSortValue(row, key) {
    if (key === "symbol") return row.symbol;
    if (key === "market") return row.market;
    if (key === "price") return row.currentPrice;
    if (key === "volume") return row.currentVolume;
    const col = AVAILABLE_COLUMNS.find((c) => c.key === key);
    return col ? row[col.field] : null;
  }

  const STRING_KEYS = new Set(["symbol", "market"]);
  function handleSort(key) {
    setSort((current) => nextSortState(current, key, STRING_KEYS.has(key)));
  }

  const sortedItems = sortRows(items, sort, getSortValue);

  function handleDeleteList() {
    if (!window.confirm(`Delete "${watchlist.name}" and everything in it?`)) return;
    startTransition(async () => {
      await deleteWatchlist(watchlist.id);
      router.refresh();
    });
  }

  function handleRemoveItem(itemId) {
    startTransition(async () => {
      await removeWatchlistItem(itemId);
      onEdited();
      router.refresh();
    });
  }

  // Collapsed state: a single clickable row showing just the name and
  // item count — this is the actual fix for the reported problem, since
  // rendering every watchlist's full table simultaneously made the page
  // grow very long with more than one or two lists.
  if (!isExpanded) {
    return (
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-between border border-ink-700 rounded-lg bg-ink-900 px-5 py-3 mb-4 hover:bg-ink-800/60 transition-colors text-left"
      >
        <span className="font-display text-base text-paper">{watchlist.name}</span>
        <span className="text-paper/40 text-xs font-body">
          {items.length} {items.length === 1 ? "ticker" : "tickers"}
        </span>
      </button>
    );
  }

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <button onClick={onExpand} className="font-display text-base text-paper hover:text-brass-400 text-left">
          {watchlist.name} ▾
        </button>
        <div className="flex items-center gap-2">
          <ColumnPicker watchlistId={watchlist.id} visibleColumns={visibleColumns} onEdited={onEdited} />
          {items.length > 0 && (
            <>
              <button
                onClick={() => exportWatchlist(watchlist, items, visibleColumns, "csv")}
                className="text-paper/50 text-xs font-body border border-ink-700 rounded-md px-2.5 py-1 hover:bg-ink-800"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportWatchlist(watchlist, items, visibleColumns, "json")}
                className="text-paper/50 text-xs font-body border border-ink-700 rounded-md px-2.5 py-1 hover:bg-ink-800"
              >
                Export JSON
              </button>
            </>
          )}
          <button
            onClick={handleDeleteList}
            disabled={isPending}
            className="text-loss text-xs font-body hover:underline disabled:opacity-50"
          >
            Delete list
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-paper/30 text-sm font-body">No tickers yet — add one below.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-paper/40 font-body text-xs uppercase tracking-wide border-b border-ink-800">
                <SortableHeader label="Ticker" sortKey="symbol" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Market" sortKey="market" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Price" sortKey="price" currentSort={sort} onSort={handleSort} align="right" />
                <SortableHeader label="Volume" sortKey="volume" currentSort={sort} onSort={handleSort} align="right" />
                {activeColumns.map((col) => (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    currentSort={sort}
                    onSort={handleSort}
                    align="right"
                    className="whitespace-nowrap"
                  />
                ))}
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} className="border-b border-ink-800/60">
                  <td className="py-2 pr-3">
                    <Link href={`/markets/${item.market}/${item.symbol}`} className="hover:underline">
                      <span className="font-mono text-brass-400">{item.symbol}</span>
                      <div className="text-paper/40 text-xs font-body">{item.name}</div>
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-paper/60 font-body">{item.market}</td>
                  <td className="py-2 pr-3 text-right font-mono text-paper/80">
                    {item.currentPrice != null ? `$${item.currentPrice.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-paper/60">
                    {formatUsdCompact(item.currentVolume)}
                  </td>
                  {activeColumns.map((col) => (
                    <td key={col.key} className="py-2 pr-3 text-right font-mono text-paper/60 whitespace-nowrap">
                      {formatColumnValue(item[col.field], col.format)}
                    </td>
                  ))}
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
        </div>
      )}

      <AddTickerForm watchlistId={watchlist.id} availableMarkets={availableMarkets} onEdited={onEdited} />

      {items.length > 0 && items[0].dataDate && (
        <p className="text-paper/25 text-[11px] font-body mt-3">
          Price/volume as of {new Date(items[0].dataDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })} — the most recent data available, not necessarily today's date.
        </p>
      )}
    </div>
  );
}

export default function WatchlistManager({ watchlists, items, availableMarkets }) {
  // Defaults to the first (earliest-created) watchlist expanded on
  // initial load, then tracks whichever one was most recently edited
  // (or newly created) as the expanded one from then on — the actual
  // fix for the reported problem, since rendering every watchlist's
  // full table simultaneously made the page grow very long with more
  // than a couple of lists. Lazy initializer (the function form of
  // useState) so this only runs once on mount, not on every re-render
  // after a router.refresh() following an edit.
  const [expandedId, setExpandedId] = useState(() => watchlists[0]?.id ?? null);

  return (
    <div>
      <NewWatchlistForm onCreated={setExpandedId} />

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
            isExpanded={watchlist.id === expandedId}
            onExpand={() => setExpandedId(watchlist.id)}
            onEdited={() => setExpandedId(watchlist.id)}
          />
        ))
      )}
    </div>
  );
}
