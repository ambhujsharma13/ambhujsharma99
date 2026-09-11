function formatUsdBn(n) {
  if (n == null) return "—";
  return `$${(n / 1_000_000_000).toFixed(1)}Bn`;
}

function formatPct(n) {
  if (n == null) return "—";
  return `${n.toFixed(3)}%`;
}

export function UpcomingAuctionsTable({ auctions }) {
  if (!auctions || auctions.length === 0) {
    return <p className="text-paper/30 text-sm font-body py-4">No upcoming auctions found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-4 font-medium">Security</th>
            <th className="py-2 pr-4 font-medium">Term</th>
            <th className="py-2 pr-4 font-medium text-right">Size</th>
            <th className="py-2 pr-4 font-medium">Auction Date</th>
            <th className="py-2 pr-4 font-medium">Issue Date</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {auctions.map((a, i) => (
            <tr key={`${a.cusip}-${i}`} className="border-b border-ink-800">
              <td className="py-2 pr-4 font-body text-paper/80 whitespace-nowrap">{a.security_type}</td>
              <td className="py-2 pr-4 font-body text-paper/60 whitespace-nowrap">{a.security_term}</td>
              <td className="py-2 pr-4 text-right font-mono text-brass-400">{formatUsdBn(a.offering_amount)}</td>
              <td className="py-2 pr-4 font-mono text-paper/70 whitespace-nowrap">{a.auction_date}</td>
              <td className="py-2 pr-4 font-mono text-paper/70 whitespace-nowrap">{a.issue_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PastAuctionsTable({ auctions }) {
  if (!auctions || auctions.length === 0) {
    return <p className="text-paper/30 text-sm font-body py-4">No past auctions found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-paper/40 font-body uppercase tracking-wide border-b border-ink-700">
            <th className="py-2 pr-4 font-medium">Security</th>
            <th className="py-2 pr-4 font-medium">Term</th>
            <th className="py-2 pr-4 font-medium text-right">Size</th>
            <th className="py-2 pr-4 font-medium text-right">Clearing Yield</th>
            <th className="py-2 pr-4 font-medium text-right">Bid-to-Cover</th>
            <th className="py-2 pr-4 font-medium">Auction Date</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {auctions.map((a, i) => {
            // Bills clear on a discount rate, not a yield — notes/bonds/
            // TIPS/FRNs clear on high_yield_pct instead. A given row
            // only ever has one of the two populated, matching which
            // result type that specific security type actually uses.
            //
            // Confirmed real edge case via live testing: some rows have
            // BOTH fields null (e.g. a reopened 1-Year 11-Month Note,
            // where FINRA hadn't yet published either result) — the
            // "(discount)" label must only appear when a discount value
            // actually exists, not as a blanket fallback whenever yield
            // is null, or a genuinely missing result gets mislabeled as
            // a discount-type result.
            const clearing = a.high_yield_pct != null ? a.high_yield_pct : a.high_discount_rate_pct;
            const clearingLabel = a.high_discount_rate_pct != null && a.high_yield_pct == null ? " (discount)" : "";
            return (
              <tr key={`${a.cusip}-${i}`} className="border-b border-ink-800">
                <td className="py-2 pr-4 font-body text-paper/80 whitespace-nowrap">{a.security_type}</td>
                <td className="py-2 pr-4 font-body text-paper/60 whitespace-nowrap">{a.security_term}</td>
                <td className="py-2 pr-4 text-right font-mono text-brass-400">{formatUsdBn(a.offering_amount)}</td>
                <td className="py-2 pr-4 text-right font-mono text-paper/80 whitespace-nowrap">
                  {formatPct(clearing)}
                  {clearingLabel}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-paper/60">
                  {a.bid_to_cover_ratio != null ? a.bid_to_cover_ratio.toFixed(2) : "—"}
                </td>
                <td className="py-2 pr-4 font-mono text-paper/70 whitespace-nowrap">{a.auction_date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-paper/25 text-[10px] font-body mt-2">
        Clearing yield is the highest accepted yield at auction — the rate every accepted bidder, competitive and
        noncompetitive, receives under Treasury's single-price auction rules. Bills clear on a discount rate instead,
        marked "(discount)".
      </p>
    </div>
  );
}
