// Highest tier first, matching the Discord-research pattern of
// showing higher-standing members' groups above everyone else's.
import RoleBadge from "./RoleBadge";

const TIER_ORDER = ["senior_research_analyst", "quarterback", "captain", "member"];
const TIER_LABELS = {
  senior_research_analyst: "Senior Research Analyst",
  quarterback: "Quarterback",
  captain: "Captain",
  member: "Member",
};

export default function ParticipantList({ members, roleDefinitions = [] }) {
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
                <div key={member.user_id} className="flex items-center gap-2 text-sm font-body">
                  <span className="text-paper/80 truncate flex-1">{member.profiles?.display_name || "Member"}</span>
                  <RoleBadge adminRole={member.profiles?.admin_role} roleDefinitions={roleDefinitions} />
                  {member.isAdmin && <span className="text-brass-400 text-xs shrink-0">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
