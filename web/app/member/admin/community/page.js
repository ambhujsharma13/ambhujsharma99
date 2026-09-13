import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import CABoostManager from "../../../../components/CABoostManager";

export const metadata = { title: "Community Admin — InfinityVolume" };

export default async function CommunityAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles").select("admin_role").eq("id", user.id).single();

  if (!["super_admin", "community"].includes(profile?.admin_role)) {
    redirect("/member/settings");
  }

  // CA's current boost grants
  const { data: myBoosts } = await supabase
    .from("omega_boosts")
    .select("id, recipient_id, reason, created_at, boost_points, profiles!omega_boosts_recipient_id_fkey(display_name, admin_role, omega_score)")
    .eq("granted_by", user.id)
    .order("created_at", { ascending: false });

  // All members for the boost selector (exclude self)
  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, admin_role, omega_score")
    .neq("id", user.id)
    .order("display_name");

  // All boosts (SA can see all; CA sees only their own via RLS)
  const { data: allBoosts } = profile?.admin_role === "super_admin"
    ? await supabase
        .from("omega_boosts")
        .select("id, recipient_id, reason, created_at, boost_points, profiles!omega_boosts_recipient_id_fkey(display_name), granted:profiles!omega_boosts_granted_by_fkey(display_name)")
        .order("created_at", { ascending: false })
    : { data: null };

  const MAX_BOOSTS = 3;
  const boostedMemberIds = new Set((myBoosts || []).map(b => b.recipient_id));

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-xl text-paper">Community Admin</h1>
        <p className="text-paper/40 text-xs font-body mt-0.5">
          Manage community health — hide posts, lock threads, and recognise outstanding members.
        </p>
      </div>

      {/* Omega Boost section */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide">
            Community Omega Boosts
          </p>
          <span className="text-xs font-body text-paper/40">
            {(myBoosts || []).length} / {MAX_BOOSTS} active
          </span>
        </div>

        <div className="border border-ink-700 rounded-lg bg-ink-900 p-5 mb-4">
          <p className="text-paper/60 text-sm font-body mb-4">
            Recognise members who make exceptional contributions to the community. Each boost grants{" "}
            <span className="text-brass-400">+5 Omega points</span> and is visible on their profile.
            You can grant up to <span className="text-brass-400">{MAX_BOOSTS}</span> active boosts.
          </p>

          <CABoostManager
            members={members || []}
            myBoosts={myBoosts || []}
            boostedMemberIds={Array.from(boostedMemberIds)}
            maxBoosts={MAX_BOOSTS}
            currentUserId={user.id}
          />
        </div>

        {/* SA: all platform boosts */}
        {profile?.admin_role === "super_admin" && (allBoosts || []).length > 0 && (
          <div>
            <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-2">
              All active boosts — {(allBoosts || []).length}
            </p>
            <div className="border border-ink-700 rounded-lg bg-ink-900 divide-y divide-ink-800">
              {(allBoosts || []).map(b => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-paper/80 text-sm font-body">
                      {b.profiles?.display_name}
                      <span className="text-paper/30 ml-2 text-xs">+{b.boost_points} pts</span>
                    </p>
                    <p className="text-paper/30 text-xs font-body">
                      by {b.granted?.display_name}
                      {b.reason && ` — "${b.reason}"`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Moderation guide */}
      <section>
        <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
          Post Moderation
        </p>
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-5">
          <p className="text-paper/60 text-sm font-body mb-2">
            To hide or lock a post, go to the channel it was posted in and use the{" "}
            <span className="text-paper/80">⋯ more</span> menu on the post (visible to CA and SA only).
          </p>
          <p className="text-paper/30 text-xs font-body">
            Hidden posts show as "[Hidden by community admin]" to regular members. Locked posts prevent new replies.
            Both actions are reversible.
          </p>
        </div>
      </section>
    </main>
  );
}
