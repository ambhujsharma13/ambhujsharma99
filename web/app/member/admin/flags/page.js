import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import TAFlagManager from "../../../../components/TAFlagManager";

export const metadata = { title: "Flagged Content — InfinityVolume Admin" };

export default async function AdminFlagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles").select("admin_role").eq("id", user.id).single();
  if (!["super_admin", "technical"].includes(profile?.admin_role)) redirect("/member/settings");

  const { data: flags } = await supabase
    .from("post_flags")
    .select(`
      id, reason, status, created_at,
      discussion_posts (id, content, channel_id, channels(name, visibility)),
      profiles!post_flags_flagged_by_fkey (display_name)
    `)
    .order("created_at", { ascending: false });

  const pending = (flags || []).filter(f => f.status === "pending");
  const reviewed = (flags || []).filter(f => f.status !== "pending");

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-xl text-paper">Flagged Content</h1>
        {pending.length > 0 && (
          <span className="text-xs font-body bg-loss/20 text-loss px-2 py-1 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 && reviewed.length === 0 && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <p className="text-paper/40 font-body text-sm">No flagged posts.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
            Pending review — {pending.length}
          </p>
          <TAFlagManager flags={pending} />
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
            Reviewed — {reviewed.length}
          </p>
          <TAFlagManager flags={reviewed} compact />
        </section>
      )}
    </main>
  );
}
