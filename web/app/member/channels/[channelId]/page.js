import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ChannelPosts from "../../../../components/ChannelPosts";
import InviteMemberForm from "../../../../components/InviteMemberForm";
import ChannelCoverImage from "../../../../components/ChannelCoverImage";
import ParticipantList from "../../../../components/ParticipantList";

export default async function ChannelDetailPage({ params }) {
  const { channelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // If this channel doesn't exist, OR it's private and this user isn't
  // a member/admin, RLS returns no row here — same 404 either way,
  // which is the correct behavior: a private channel you don't belong
  // to should look identical to one that doesn't exist, not reveal
  // that it exists but is off-limits.
  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, description, visibility, cover_image_url")
    .eq("id", channelId)
    .single();

  if (!channel) {
    notFound();
  }

  const { data: posts } = await supabase
    .from("discussion_posts")
    .select("id, content, created_at, is_pinned, profiles(display_name)")
    .eq("channel_id", channelId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Checks whether the current user is a CHANNEL admin here (not the
  // site-wide admin_role, a completely separate, channel-scoped
  // concept) — checked for both public and private channels now, since
  // cover-image upload rights depend on this regardless of visibility,
  // not just the invite form (which stays private-only below).
  const { data: adminRow } = await supabase
    .from("channel_admins")
    .select("user_id")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();
  const isChannelAdmin = !!adminRow;

  // Participant list is scoped to private channels only — public
  // channels don't track explicit membership the same way (anyone can
  // read/post in them), so "who's a participant" isn't a well-defined
  // question there yet.
  let members = [];
  if (channel.visibility === "private") {
    const { data: memberRows } = await supabase
      .from("channel_members")
      .select("user_id, profiles(display_name)")
      .eq("channel_id", channelId);

    const { data: adminRows } = await supabase.from("channel_admins").select("user_id").eq("channel_id", channelId);
    const adminIds = new Set((adminRows || []).map((a) => a.user_id));

    members = (memberRows || []).map((m) => ({ ...m, isAdmin: adminIds.has(m.user_id) }));
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-paper/40 text-xs font-body uppercase tracking-wide mb-1">
        {channel.visibility === "private" ? "Private Channel" : "Public Channel"}
      </p>
      <h1 className="font-display text-xl text-paper mb-2">{channel.name}</h1>
      {channel.description && <p className="text-paper/40 font-body text-sm mb-4">{channel.description}</p>}
      <ChannelCoverImage
        channelId={channel.id}
        coverImageUrl={channel.cover_image_url}
        isChannelAdmin={isChannelAdmin}
      />
      {channel.visibility === "private" && <ParticipantList members={members} />}
      {isChannelAdmin && channel.visibility === "private" && <InviteMemberForm channelId={channel.id} />}
      <ChannelPosts channelId={channel.id} posts={posts || []} />
    </main>
  );
}
