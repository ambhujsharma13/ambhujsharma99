// Displays an author's Omega score and member tier contextually —
// wherever seeing the author's standing adds signal (posts, profile,
// article cards) rather than as a stat for its own sake.
//
// Omega score = weighted community contribution across 5 pillars:
//   article quality (25%) + channel posts (20%) + likes received (20%)
//   + article reactions (15%) + network/contacts (10%)
//
// Member tier is derived purely from Omega:
//   0-39 = Member, 40-69 = Captain, 70-89 = Quarterback,
//   90+ = Senior Research Analyst
//
// size="sm" — compact, used inline on channel posts/replies
// size="md" — slightly larger, used on profile pages
// showScore — whether to show the numeric score alongside the tier label.
//             Off by default for inline use (too noisy), on for profile pages.

const TIER_CONFIG = {
  senior_research_analyst: { label: "SRA", fullLabel: "Senior Research Analyst", color: "#D4A574" },
  quarterback: { label: "QB", fullLabel: "Quarterback", color: "#7C9EB2" },
  captain: { label: "CPT", fullLabel: "Captain", color: "#8FA876" },
  member: null, // no badge for base tier — avoids cluttering every new member's posts
};

export default function OmegaBadge({ omegaScore, memberTier, size = "sm", showScore = false }) {
  const tier = TIER_CONFIG[memberTier];

  // Don't render anything for base "member" tier or missing data —
  // the badge only appears once someone has earned an elevated tier.
  if (!tier || !memberTier || memberTier === "member") {
    if (showScore && omegaScore > 0) {
      // On profile pages with showScore=true, show the raw number even
      // for base-tier members so their activity is still visible.
      return (
        <span className="text-paper/40 text-xs font-mono" title="Omega score — community contribution index">
          Ω {omegaScore}
        </span>
      );
    }
    return null;
  }

  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-1";

  const tooltip = showScore
    ? `${tier.fullLabel} · Ω ${omegaScore}`
    : tier.fullLabel;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        title={tooltip}
        className={`inline-flex items-center rounded font-mono font-semibold uppercase tracking-wide text-ink-950 ${sizeClasses}`}
        style={{ backgroundColor: tier.color }}
      >
        {tier.label}
      </span>
      {showScore && (
        <span className="text-paper/40 text-xs font-mono" title="Omega score">
          Ω {omegaScore}
        </span>
      )}
    </span>
  );
}
