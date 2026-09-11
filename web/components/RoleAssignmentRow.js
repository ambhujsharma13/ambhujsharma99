"use client";

import { useState, useTransition } from "react";
import { setAdminRole } from "../lib/admin-actions";

const TIER_LABELS = {
  member: "Member",
  captain: "Captain",
  quarterback: "Quarterback",
  senior_research_analyst: "Senior Research Analyst",
};

export default function RoleAssignmentRow({ member, roleDefinitions = [] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleChange(e) {
    const newRole = e.target.value === "none" ? null : e.target.value;
    setError("");
    startTransition(async () => {
      const result = await setAdminRole(member.id, newRole);
      if (result?.error) setError(result.error);
    });
  }

  // Build dropdown options dynamically from role definitions — excludes
  // is_system_role rows (super_admin) since those aren't assignable via
  // this UI, same rule that was previously encoded as a hardcoded array.
  const assignableRoles = roleDefinitions.filter((r) => !r.is_system_role);

  return (
    <tr className="border-b border-ink-800">
      <td className="py-3 pr-4">
        <div className="text-paper/80 font-body">{member.display_name || "Unnamed"}</div>
        <div className="text-paper/30 text-xs font-body">{member.email}</div>
      </td>
      <td className="py-3 pr-4 text-paper/60 font-body">
        {TIER_LABELS[member.member_tier] || member.member_tier}
      </td>
      <td className="py-3 pr-4 text-right font-mono text-paper/60">{member.omega_score ?? 0}</td>
      <td className="py-3 pr-4">
        {member.admin_role === "super_admin" ? (
          <span className="text-brass-400 text-xs font-body">Super Admin</span>
        ) : (
          <select
            defaultValue={member.admin_role || "none"}
            onChange={handleChange}
            disabled={isPending}
            className="bg-ink-800 border border-ink-700 rounded px-2 py-1 text-paper text-sm font-body disabled:opacity-50"
          >
            <option value="none">No admin role</option>
            {assignableRoles.map((r) => (
              <option key={r.role_key} value={r.role_key}>
                {r.abbreviation} — {r.label}
              </option>
            ))}
          </select>
        )}
        {error && <p className="text-loss text-xs font-body mt-1">{error}</p>}
      </td>
    </tr>
  );
}
