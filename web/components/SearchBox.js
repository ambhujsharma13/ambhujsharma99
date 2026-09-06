"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TYPE_LABEL = { stock: "Stock", etf: "ETF", treasury: "Treasury", indicator: "Indicator" };

export default function SearchBox() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Loaded once on mount — the whole index is only a few hundred entries,
  // small enough to filter entirely client-side per keystroke rather than
  // hitting an API on every character typed.
  useEffect(() => {
    fetch("/data/_search_index.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const q = query.trim().toLowerCase();
  const matches =
    q.length === 0
      ? []
      : items
          .filter((item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q))
          .slice(0, 8);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search tickers, ETFs, indicators…"
        className="w-full bg-ink-900 border border-ink-700 rounded-full px-4 py-1.5 text-xs font-body text-paper placeholder:text-paper/30 focus:outline-none focus:border-brass-500/50"
      />

      {open && q.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-ink-900 border border-ink-700 rounded-lg shadow-lg overflow-hidden z-50">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-xs font-body text-paper/40">No matches</div>
          ) : (
            matches.map((item) => (
              <Link
                key={`${item.type}-${item.symbol}`}
                href={
                  item.type === "stock"
                    ? `/markets/${item.market}/${encodeURIComponent(item.symbol)}`
                    : item.url
                }
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                className="flex items-center justify-between px-4 py-2 hover:bg-ink-800 transition-colors border-b border-ink-800 last:border-b-0"
              >
                <span>
                  <span className="font-mono text-brass-400 text-xs">{item.symbol}</span>{" "}
                  <span className="text-paper/60 text-xs font-body">{item.name}</span>
                </span>
                <span className="text-paper/30 text-[10px] font-body uppercase tracking-wide">
                  {TYPE_LABEL[item.type] || item.type}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
