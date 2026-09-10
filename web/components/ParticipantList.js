// Highest tier first, matching the Discord-research pattern of
// showing higher-standing members' groups above everyone else's.
// Separate from channel-admin status (kept as its own inline badge
// below) since these are two genuinely independent concepts — a
// channel admin might be a brand-new Member tier user, and a Senior
// Research Analyst might not be a channel admin at all.
const TIER_ORDER = ["senior_research_analyst", "quarterback", "captain", "member"];
const TIER_LABELS = {
  senior_research_analyst: "Senior Research Analyst",
  quarterback: "Quarterback",
  captain: "Captain",
  member: "Member",
};

export default function ParticipantList({ members }) {
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    people: members.filter((m) => (m.profiles?.member_tier || "member") === tier),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-3">
        Participants ({members.length})
      </p>
      <div className="max-h-[28rem] overflow-y-auto space-y-4 pr-1">
        {groups.map((group) => (
          <div key={group.tier}>
            <p className="text-paper/30 text-[11px] font-body uppercase tracking-wide mb-1.5">
              {group.label} — {group.people.length}
            </p>
            <div className="space-y-1.5">
              {group.people.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between text-sm font-body">
                  <span className="text-paper/80 truncate">{member.profiles?.display_name || "Member"}</span>
                  {member.isAdmin && <span className="text-brass-400 text-xs shrink-0 ml-2">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
