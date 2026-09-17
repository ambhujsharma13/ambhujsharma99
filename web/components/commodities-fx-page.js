"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

// ─── Section definitions — order: Precious Metals, Crypto, Energy, Global Consumption ───
const SECTIONS = [
  {
    key: "precious_metals",
    label: "Precious Metals",
    symbols: ["GC=F", "SI=F", "PL=F", "PA=F", "HG=F"],
  },
  {
    key: "crypto",
    label: "Crypto",
    symbols: ["BTC-USD", "ETH-USD", "SOL-USD"],
  },
  {
    key: "energy",
    label: "Energy",
    symbols: ["CL=F", "BZ=F", "NG=F", "HO=F"],
  },
  {
    key: "global_consumption",
    label: "Global Consumption",
    symbols: ["ZS=F", "ZC=F", "ZW=F", "KC=F", "SB=F", "CT=F", "CC=F"],
  },
];

const FX_ORDER = ["EUR", "GBP", "JPY", "CNY", "CAD", "INR", "BRL", "KRW", "TRY", "ILS"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(v, unit) {
  if (v == null) return "—";
  // Grain futures quoted in cents — convert to dollars for display
  const inCents = unit && unit.includes("cents");
  const val = inCents ? v / 100 : v;
  if (val >= 10000) return `$${(val / 1000).toFixed(1)}K`;
  if (val >= 1000)  return `$${val.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (val >= 1)     return `$${val.toFixed(2)}`;
  return `$${val.toFixed(4)}`;
}

function fmtPct(v) {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function fmtVol(v) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

function fmtRate(v) {
  if (v == null) return "—";
  return v.toFixed(4);
}

function PctCell({ value }) {
  if (value == null) return <span className="text-paper/30">—</span>;
  const color = value > 0 ? "text-gain" : value < 0 ? "text-loss" : "text-paper/50";
  return <span className={`font-mono text-xs ${color}`}>{fmtPct(value)}</span>;
}

// ─── Sortable column header ────────────────────────────────────────────────────
function SortHeader({ label, col, sortState, onSort }) {
  const active = sortState.col === col;
  return (
    <th
      className="py-1.5 px-2 text-right text-[10px] font-body uppercase tracking-widest text-paper/30 cursor-pointer select-none hover:text-paper/60 transition-colors"
      onClick={() => onSort(col)}
    >
      {label}
      {active && <span className="ml-1 text-brass-400">{sortState.dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );
}

// ─── Commodity subsection ──────────────────────────────────────────────────────
function CommoditySection({ section, commodities, updatedAt }) {
  const [open, setOpen] = useState(true);
  const [sort, setSort] = useState({ col: null, dir: "desc" });

  function handleSort(col) {
    setSort(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
  }

  const rows = useMemo(() => {
    const base = section.symbols.map(sym => {
      const c = commodities[sym];
      if (!c) return { sym, name: sym, unit: "—", latest: null };
      const latest = c.history?.[c.history.length - 1] || null;
      return { sym, name: c.name, unit: c.unit, latest };
    });
    if (!sort.col) return base;
    return [...base].sort((a, b) => {
      const av = a.latest?.[sort.col] ?? null;
      const bv = b.latest?.[sort.col] ?? null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort.dir === "asc" ? av - bv : bv - av;
    });
  }, [section.symbols, commodities, sort]);

  const dateStr = updatedAt ? new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="mb-6">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 border-b border-ink-700 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-paper/40 text-[10px] font-body uppercase tracking-widest">{section.label}</span>
          {dateStr && <span className="text-paper/25 text-[10px] font-body">as of {dateStr}</span>}
        </div>
        <span className={`text-paper/30 text-xs transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
      </button>

      {open && (
        <table className="w-full text-sm mt-1">
          <thead>
            <tr>
              <th className="py-1.5 px-2 text-left text-[10px] font-body uppercase tracking-widest text-paper/30 w-32">Commodity</th>
              <SortHeader label="Price" col="close_usd" sortState={sort} onSort={handleSort} />
              <SortHeader label="1D %" col="daily_change_pct" sortState={sort} onSort={handleSort} />
              <SortHeader label="3D %" col="rolling_3d_change_pct" sortState={sort} onSort={handleSort} />
              <SortHeader label="Volume" col="volume_contracts" sortState={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sym, name, unit, latest }) => (
              <tr key={sym} className="border-b border-ink-800/60 hover:bg-ink-800/30 transition-colors">
                <td className="py-2 px-2">
                  <span className="text-paper/80 text-xs font-body">{name}</span>
                  <span className="text-paper/25 text-[10px] font-body ml-1.5">{unit?.replace("USD cents", "¢").replace(" (CBOT)", "").replace(" (ICE)", "")}</span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs text-paper/80">
                  {fmtPrice(latest?.close_usd, unit)}
                </td>
                <td className="py-2 px-2 text-right">
                  <PctCell value={latest?.daily_change_pct} />
                </td>
                <td className="py-2 px-2 text-right">
                  <PctCell value={latest?.rolling_3d_change_pct} />
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs text-paper/50">
                  {fmtVol(latest?.volume_contracts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── FX section ───────────────────────────────────────────────────────────────
function FXSection({ currencies }) {
  const [sort, setSort] = useState({ col: null, dir: "desc" });

  function handleSort(col) {
    setSort(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
  }

  const rows = useMemo(() => {
    const base = FX_ORDER.map(code => {
      const c = currencies[code];
      if (!c) return { code, label: code, latest: null };
      const latest = c.history?.[c.history.length - 1] || null;
      return { code, label: c.label, latest };
    });
    if (!sort.col) return base;
    return [...base].sort((a, b) => {
      const av = a.latest?.[sort.col] ?? null;
      const bv = b.latest?.[sort.col] ?? null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort.dir === "asc" ? av - bv : bv - av;
    });
  }, [currencies, sort]);

  const anyLatest = rows.find(r => r.latest)?.latest;
  const dateStr = anyLatest ? new Date(anyLatest.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between py-2 border-b border-ink-700 mb-1">
        <div className="flex items-center gap-3">
          <span className="text-paper/40 text-[10px] font-body uppercase tracking-widest">FX Rates vs USD</span>
          {dateStr && <span className="text-paper/25 text-[10px] font-body">as of {dateStr}</span>}
        </div>
        <span className="text-paper/25 text-[10px] font-body">Source: ECB / Frankfurter</span>
      </div>

      <table className="w-full text-sm mt-1">
        <thead>
          <tr>
            <th className="py-1.5 px-2 text-left text-[10px] font-body uppercase tracking-widest text-paper/30 w-40">Currency</th>
            <th className="py-1.5 px-2 text-right text-[10px] font-body uppercase tracking-widest text-paper/30">1 Unit → USD</th>
            <SortHeader label="1D %" col="daily_change_pct" sortState={sort} onSort={handleSort} />
            <SortHeader label="3D %" col="rolling_3d_change_pct" sortState={sort} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ code, label, latest }) => (
            <tr key={code} className="border-b border-ink-800/60 hover:bg-ink-800/30 transition-colors">
              <td className="py-2 px-2">
                <span className="text-paper/80 text-xs font-body">{label}</span>
                <span className="text-paper/35 text-[10px] font-body ml-1.5">{code}</span>
              </td>
              <td className="py-2 px-2 text-right font-mono text-xs text-paper/80">
                {latest ? `$${fmtRate(latest.usd_rate)}` : "—"}
              </td>
              <td className="py-2 px-2 text-right">
                <PctCell value={latest?.daily_change_pct} />
              </td>
              <td className="py-2 px-2 text-right">
                <PctCell value={latest?.rolling_3d_change_pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommoditiesFXPage({ commoditiesData, currenciesData }) {
  const commodities = commoditiesData?.commodities || {};
  const currencies  = currenciesData?.currencies  || {};

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">Infinity</Link>
        <span className="mx-1.5">/</span>
        <span className="text-paper/60">Commodities &amp; FX</span>
      </nav>

      <h1 className="font-display text-3xl text-paper mb-1">Commodities &amp; FX</h1>
      <p className="text-paper/40 text-sm font-body mb-8">
        Daily price, 1-day and 3-day change, and contract volume for global commodities futures and crypto. FX rates from ECB via Frankfurter. All prices in USD.
      </p>

      {/* Commodity sections */}
      {SECTIONS.map(section => (
        <CommoditySection
          key={section.key}
          section={section}
          commodities={commodities}
          updatedAt={commoditiesData?.fetched_at}
        />
      ))}

      {/* FX section */}
      <FXSection currencies={currencies} />
    </main>
  );
}
