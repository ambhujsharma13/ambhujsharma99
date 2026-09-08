import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { signOut } from "../../../lib/auth-actions";

const TIER_LABELS = {
  member: "Member",
  captain: "Captain",
  quarterback: "Quarterback",
  senior_research_analyst: "Senior Research Analyst",
};

const ADMIN_ROLE_LABELS = {
  technical: "Technical Admin",
  research: "Research Admin",
  super_admin: "Super Admin",
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
    .select("member_tier, admin_role, omega_score, is_og_member")
    .eq("id", user.id)
    .single();

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-6">Settings</h1>

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
            <p className="text-brass-400 font-body">{ADMIN_ROLE_LABELS[profile.admin_role]}</p>
          </div>
        )}
      </div>

      {profile?.admin_role === "super_admin" && (
        <Link
          href="/member/admin"
          className="block text-center text-brass-400 text-sm font-body border border-ink-700 rounded-md px-4 py-2 hover:bg-ink-800 transition-colors mb-6"
        >
          Manage member roles →
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
