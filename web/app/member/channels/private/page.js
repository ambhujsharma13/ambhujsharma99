import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ChannelList from "../../../../components/ChannelList";

export default async function PrivateChannelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // No explicit membership filter needed here — the RLS policy on
  // channels already restricts private-channel visibility to members
  // and admins of that specific channel, so this query naturally only
  // returns the ones this user actually belongs to.
  const { data: channels } = await supabase
    .from("channels")
    .select("id, name, description")
    .eq("visibility", "private")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-xl text-paper mb-2">Private Channels</h1>
      <p className="text-paper/40 font-body text-sm mb-6">
        Your Mastermind groups — invite-only channels you've created or been added to. Visible only
        to their members.
      </p>
      <ChannelList visibility="private" channels={channels || []} />
    </main>
  );
}
