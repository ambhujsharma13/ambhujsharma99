import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import CABoostManager from "../../../../components/CABoostManager";
import ResearchQueue from "../../../../components/ResearchQueue";

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

  // Human Intel research queue — all requests visible to CA/RA/SA
  const { data: intelRequests } = await supabase
    .from("human_intel_requests")
    .select("id, question, context, category, status, response, follow_up_question, denial_reason, created_at, accepted_by, accepted_at, answered_at, profiles!human_intel_requests_user_id_fkey(id, display_name, omega_score, admin_role)")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-xl text-paper">Community Admin</h1>
        <p className="text-paper/40 text-xs font-body mt-0.5">
          Manage community health, respond to Human Intel research requests, and recognise outstanding members.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">

        {/* LEFT — Human Intel Research Queue */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide">Human Intel Research Queue</p>
            <span className="text-xs font-body text-paper/30">{(intelRequests || []).length} total</span>
          </div>
          <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-4 mb-4">
            <p className="text-paper/50 text-xs font-body leading-relaxed">
              Review member research questions. <span className="text-blue-400">Accept &amp; claim</span> a request to lock it to you and work on a response. Use <span className="text-orange-400">↩ Follow-up</span> to ask for more details. <span className="text-loss">✕ Deny</span> if the question is out of scope.
            </p>
          </div>
          <ResearchQueue requests={intelRequests || []} currentUserId={user.id} />
        </div>

        {/* RIGHT — Omega Boosts */}
        <div className="w-96 shrink-0">
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

          {/* Omega Boost section inside right column */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide">Omega Boosts</p>
              <span className="text-xs font-body text-paper/40">{(myBoosts || []).length}/{MAX_BOOSTS}</span>
            </div>
            <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-4 mb-3">
              <p className="text-paper/50 text-xs font-body mb-3 leading-relaxed">
                Recognise outstanding members with <span className="text-brass-400">+5 Omega points</span>. Max {MAX_BOOSTS} active boosts.
              </p>
              <CABoostManager
                members={members || []}
                myBoosts={myBoosts || []}
                boostedMemberIds={Array.from(boostedMemberIds)}
                maxBoosts={MAX_BOOSTS}
                currentUserId={user.id}
              />
            </div>
          </div>

          {/* Post moderation guide */}
          <div className="border border-ink-700 rounded-xl bg-ink-900/60 p-4">
            <p className="text-paper/40 text-[10px] font-body uppercase tracking-widest mb-2">Post Moderation</p>
            <p className="text-paper/50 text-xs font-body leading-relaxed">
              To hide or lock a post, go to the channel and use the <span className="text-paper/70">⋯ more</span> menu on the post (CA and SA only). Hidden posts show as "[Hidden by community admin]". Both actions are reversible.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
