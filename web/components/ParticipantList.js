export default function ParticipantList({ members }) {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 p-4 mb-6">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-2">
        Participants ({members.length})
      </p>
      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center justify-between text-sm font-body">
            <span className="text-paper/80">{member.profiles?.display_name || "Member"}</span>
            {member.isAdmin && <span className="text-brass-400 text-xs">Admin</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
