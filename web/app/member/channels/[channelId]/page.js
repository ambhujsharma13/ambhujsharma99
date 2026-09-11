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

  const { data: allPosts, error: postsError } = await supabase
    .from("discussion_posts")
    // profiles(...) explicitly disambiguated via the foreign key
    // constraint name — confirmed necessary after a real PGRST201
    // error: adding post_likes (which has its own FK to both
    // discussion_posts and profiles) created a second possible path
    // between discussion_posts and profiles, so PostgREST could no
    // longer infer which relationship this embed meant on its own.
    .select(
      "id, content, created_at, is_pinned, parent_post_id, profiles!discussion_posts_user_id_fkey(display_name, admin_role, member_tier, omega_score)"
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true }); // ascending here so replies naturally group in chronological order below

  // Role definitions for badge rendering next to each post/reply author
  // — small, rarely-changing table, fetched once here per page load
  // rather than per-post, and passed down to ChannelPosts as a prop.
  const { data: roleDefinitions } = await supabase
    .from("admin_role_definitions")
    .select("role_key, abbreviation, label, description, badge_color");

  // Logged so a genuine query failure (e.g. a column that doesn't
  // exist yet because a migration wasn't run) is actually visible
  // somewhere — this previously discarded the error entirely, which
  // meant a real failure and "no posts exist" were indistinguishable.
  // Embedded directly into the log string via JSON.stringify rather
  // than passed as a second argument — confirmed necessary since
  // Next.js's dev error overlay wasn't displaying the second argument's
  // contents at all, only ever showing "{}" for it regardless of what
  // was actually inside.
  if (postsError) {
    console.error("Failed to fetch discussion_posts: " + JSON.stringify(postsError, Object.getOwnPropertyNames(postsError)));
  }

  // Likes fetched separately, for every post/reply in this channel at
  // once, then grouped into per-post counts + whether the current user
  // is among the likers — avoids an extra query per post.
  const allPostIds = (allPosts || []).map((p) => p.id);
  const { data: allLikes, error: likesError } =
    allPostIds.length > 0
      ? await supabase.from("post_likes").select("post_id, user_id").in("post_id", allPostIds)
      : { data: [] };
  if (likesError) console.error("Failed to fetch post_likes:", likesError);
  const likesByPost = {};
  for (const like of allLikes || []) {
    if (!likesByPost[like.post_id]) likesByPost[like.post_id] = [];
    likesByPost[like.post_id].push(like.user_id);
  }
  function attachLikeInfo(post) {
    const likerIds = likesByPost[post.id] || [];
    return { ...post, likeCount: likerIds.length, likedByMe: likerIds.includes(user.id) };
  }

  // Splits the flat query result into top-level posts (pinned first,
  // then newest first) each carrying their own replies array
  // (chronological, oldest first — the natural reading order for a
  // reply thread, unlike the top-level feed itself).
  const topLevelPosts = (allPosts || []).filter((p) => !p.parent_post_id);
  const repliesByParent = {};
  for (const post of allPosts || []) {
    if (post.parent_post_id) {
      if (!repliesByParent[post.parent_post_id]) repliesByParent[post.parent_post_id] = [];
      repliesByParent[post.parent_post_id].push(attachLikeInfo(post));
    }
  }
  const posts = topLevelPosts
    .map((p) => ({ ...attachLikeInfo(p), replies: repliesByParent[p.id] || [] }))
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

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
  // question there yet. member_tier fetched alongside display_name so
  // the list can group by tier (Discord-research-derived pattern),
  // kept as a separate concern from channel-admin status, which stays
  // its own inline badge rather than folding into the tier grouping.
  let members = [];
  if (channel.visibility === "private") {
    const { data: memberRows } = await supabase
      .from("channel_members")
      .select("user_id, profiles(display_name, member_tier, admin_role)")
      .eq("channel_id", channelId);

    const { data: adminRows } = await supabase.from("channel_admins").select("user_id").eq("channel_id", channelId);
    const adminIds = new Set((adminRows || []).map((a) => a.user_id));

    members = (memberRows || []).map((m) => ({ ...m, isAdmin: adminIds.has(m.user_id) }));
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
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
      {channel.visibility === "private" ? (
        // Two-column layout, per explicit request — participant list
        // moved to the left third of the page, posts/invite on the
        // right taking the remaining space. Public channels skip this
        // entirely and keep the original single-column layout, since
        // they have no participant list to show in the first place.
        <div className="flex gap-6 items-start">
          <div className="w-1/3 shrink-0">
            <ParticipantList members={members} roleDefinitions={roleDefinitions || []} />
          </div>
          <div className="flex-1 min-w-0">
            {isChannelAdmin && <InviteMemberForm channelId={channel.id} />}
            <ChannelPosts channelId={channel.id} posts={posts || []} isChannelAdmin={isChannelAdmin} roleDefinitions={roleDefinitions || []} />
          </div>
        </div>
      ) : (
        <ChannelPosts channelId={channel.id} posts={posts || []} isChannelAdmin={isChannelAdmin} roleDefinitions={roleDefinitions || []} />
      )}
    </main>
  );
}
