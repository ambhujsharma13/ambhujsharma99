import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import SupportTicketForm from "../../../components/SupportTicketForm";
import SupportTicketList from "../../../components/SupportTicketList";

export const metadata = { title: "Tickets & Requests — InfinityVolume" };

const TYPE_ICONS = { bug: "🐛", feature: "💡", data_issue: "📊", dataset_request: "📂" };
const TYPE_LABELS = { bug: "Bug", feature: "Feature request", data_issue: "Data issue", dataset_request: "Dataset request" };

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, ticket_type, title, description, status, vote_count, created_at, submitted_by, profiles!support_tickets_submitted_by_fkey(display_name)")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

  // Check which tickets current user has voted on
  const ticketIds = (tickets || []).map(t => t.id);
  let votedIds = new Set();
  if (ticketIds.length > 0) {
    const { data: votes } = await supabase
      .from("support_ticket_votes")
      .select("ticket_id")
      .eq("user_id", user.id)
      .in("ticket_id", ticketIds);
    votedIds = new Set((votes || []).map(v => v.ticket_id));
  }

  const grouped = {
    bug: (tickets || []).filter(t => t.ticket_type === "bug"),
    feature: (tickets || []).filter(t => t.ticket_type === "feature"),
    data_issue: (tickets || []).filter(t => t.ticket_type === "data_issue"),
    dataset_request: (tickets || []).filter(t => t.ticket_type === "dataset_request"),
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-xl text-paper mb-1">Tickets & Requests</h1>
        <p className="text-paper/40 font-body text-sm">
          Report bugs, request features, flag data issues, or suggest new datasets.
          Feature requests can be upvoted by the community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission form */}
        <div className="lg:col-span-1">
          <SupportTicketForm />
        </div>

        {/* Ticket lists */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            items.length > 0 && (
              <section key={type}>
                <p className="text-paper/40 text-[11px] font-body uppercase tracking-wide mb-3">
                  {TYPE_ICONS[type]} {TYPE_LABELS[type]} — {items.length}
                </p>
                <SupportTicketList tickets={items} votedIds={votedIds} currentUserId={user.id} />
              </section>
            )
          ))}
          {(tickets || []).length === 0 && (
            <div className="border border-ink-700 rounded-lg bg-ink-900 p-8 text-center">
              <p className="text-paper/40 font-body text-sm">No tickets yet — be the first to submit feedback.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
