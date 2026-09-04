import Link from "next/link";
import { MARKETS } from "../lib/markets";
import FlagIcon from "./FlagIcon";

export default function MarketSidebar({ activeKey }) {
  return (
    <nav className="w-full">
      <ul className="space-y-1">
        {MARKETS.map((m) => {
          const isActive = m.key === activeKey;
          const href = m.key === "US" ? "/" : `/markets/${m.key}`;
          return (
            <li key={m.key}>
              {m.unavailable ? (
                <span className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-paper/25 cursor-not-allowed">
                  <span className="flex items-center gap-2">
                    <FlagIcon iso2={m.iso2} /> {m.label}
                  </span>
                  <span className="text-[10px]">N/A</span>
                </span>
              ) : (
                <Link
                  href={href}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded font-body text-sm transition-colors border ${
                    isActive
                      ? "bg-brass-500/15 text-brass-400 border-brass-500/30"
                      : "text-paper/70 hover:bg-ink-800 border-transparent"
                  }`}
                >
                  <FlagIcon iso2={m.iso2} /> {m.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {MARKETS.find((m) => m.key === activeKey)?.unavailable && (
        <p className="text-paper/40 text-xs font-body mt-4 leading-relaxed">
          Russia isn&apos;t populated — Yahoo Finance dropped MOEX tickers
          after 2022 sanctions.
        </p>
      )}
    </nav>
  );
}
