import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { signOut } from "../../../lib/auth-actions";
import RequestsBox from "../../../components/RequestsBox";
import MessagingPermissionsForm from "../../../components/MessagingPermissionsForm";
import RoleBadge from "../../../components/RoleBadge";

const TIER_LABELS = {
  member: "Member",
  captain: "Captain",
  quarterback: "Quarterback",
  senior_research_analyst: "Senior Research Analyst",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, member_tier, admin_role, omega_score, is_og_member, allow_messages_from_contacts, allow_messages_from_anyone, filter_unknown_senders"
    )
    .eq("id", user.id)
    .single();

  // Role definitions for the badge pill — same fetch as layout.js but
  // scoped here so the Settings page badge stays live even if the global
  // layout cache is stale after a role change.
  const { data: roleDefinitions } = await supabase
    .from("admin_role_definitions")
    .select("role_key, abbreviation, label, description, badge_color");

  // profiles(...) explicitly disambiguated via the FK constraint name
  // (invited_by, not invited_user_id) — pending_requests has two
  // foreign keys to profiles, and without this a PGRST201 "more than
  // one relationship found" error would silently break this query.
  const { data: requests } = await supabase
    .from("pending_requests")
    .select(
      "id, request_type, status, seen_at, created_at, channels(name), articles(title), profiles!pending_requests_invited_by_fkey(display_name, admin_role)"
    )
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">Settings / Requests</h1>

      <RequestsBox requests={requests || []} roleDefinitions={roleDefinitions || []} />

      <div className="border border-ink-700 rounded-lg bg-ink-900 p-6 mb-6 space-y-4">
        <div>
          <p className="text-paper/40 text-xs font-body mb-1">Signed in as</p>
          <p className="text-paper/90 font-body">{user.email}</p>
        </div>

        <div>
          <p className="text-paper/40 text-xs font-body mb-1">Member tier</p>
          <p className="text-paper/90 font-body">
            {TIER_LABELS[profile?.member_tier] || "Member"}
            {profile?.is_og_member && (
              <span className="ml-2 text-brass-400 text-xs">★ OG Member</span>
            )}
          </p>
        </div>

        <div>
          <p className="text-paper/40 text-xs font-body mb-1">Omega score</p>
          <p className="text-paper/90 font-mono">{profile?.omega_score ?? 0}</p>
        </div>

        {profile?.admin_role && (
          <div>
            <p className="text-paper/40 text-xs font-body mb-1">Admin role</p>
            <div className="flex items-center gap-2">
              <RoleBadge adminRole={profile.admin_role} roleDefinitions={roleDefinitions || []} size="md" />
            </div>
          </div>
        )}

        {profile?.id && (
          <div>
            <Link
              href={`/member/profile/${profile.id}`}
              className="text-brass-400 text-sm font-body hover:underline"
            >
              View your public profile →
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6">
        <MessagingPermissionsForm profile={profile || {}} />
      </div>

      {profile?.admin_role === "super_admin" && (
        <Link
          href="/member/admin"
          className="block text-center text-brass-400 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors mb-6"
        >
          Manage member roles &amp; public channels →
        </Link>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="text-paper/70 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
