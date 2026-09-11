// Small, reusable badge for admin roles (Super Admin, Technical Admin,
// Research Admin, and any custom roles a super_admin adds later, like
// the planned Community Admin). Looks up the matching definition from
// a passed-in roleDefinitions array rather than fetching its own data
// — consistent with how the rest of this codebase passes shared data
// down as props rather than via context, and avoids one DB round-trip
// per badge instance on pages with many posts/replies each showing one.
//
// Renders nothing at all for a member with no admin_role — a badge
// should only ever appear for someone who actually holds a role, never
// as an empty placeholder next to every name on the site.
export default function RoleBadge({ adminRole, roleDefinitions, size = "sm" }) {
  if (!adminRole || !roleDefinitions) return null;

  const role = roleDefinitions.find((r) => r.role_key === adminRole);
  if (!role) return null;

  const sizeClasses = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-1";

  return (
    <span
      title={`${role.label}${role.description ? ` — ${role.description}` : ""}`}
      className={`inline-flex items-center rounded font-mono font-semibold uppercase tracking-wide text-ink-950 ${sizeClasses}`}
      style={{ backgroundColor: role.badge_color }}
    >
      {role.abbreviation}
    </span>
  );
}
