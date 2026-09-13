import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import TATicketManager from "../../../../components/TATicketManager";

export const metadata = { title: "Support Queue — InfinityVolume Admin" };

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles").select("admin_role").eq("id", user.id).single();
  if (!["super_admin", "technical"].includes(profile?.admin_role)) redirect("/member/settings");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select(`
      id, ticket_type, title, description, status, vote_count,
      affected_ticker, affected_page_url, ta_notes, created_at, updated_at,
      profiles!support_tickets_submitted_by_fkey (id, display_name, admin_role),
      assignee:profiles!support_tickets_assignee_id_fkey (display_name)
    `)
    .order("status")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: true });

  const open = (tickets || []).filter(t => t.status === "open");
  const inProgress = (tickets || []).filter(t => t.status === "in_progress");
  const closed = (tickets || []).filter(t => ["resolved", "wont_fix", "duplicate"].includes(t.status));

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-display text-xl text-paper">Support Queue</h1>
          <p className="text-paper/40 text-xs font-body mt-0.5">
            Bug reports, feature requests, and data issues from members.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-body text-paper/40">
          <span className="text-loss">{open.length} open</span>
          <span className="text-brass-400">{inProgress.length} in progress</span>
          <span>{closed.length} closed</span>
        </div>
      </div>

      {open.length === 0 && inProgress.length === 0 && (
        <div className="border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
          <p className="text-paper/40 font-body text-sm">All clear — no open tickets.</p>
        </div>
      )}

      {[{ label: "Open", items: open }, { label: "In progress", items: inProgress }].map(({ label, items }) =>
        items.length > 0 && (
          <section key={label} className="mb-6">
            <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
              {label} — {items.length}
            </p>
            <TATicketManager tickets={items} assigneeId={user.id} />
          </section>
        )
      )}

      {closed.length > 0 && (
        <section>
          <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
            Closed — {closed.length}
          </p>
          <TATicketManager tickets={closed} assigneeId={user.id} compact />
        </section>
      )}
    </main>
  );
}
