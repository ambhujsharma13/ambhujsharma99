"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createChannel(name, description, visibility) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!name || !name.trim()) return { error: "Please give the channel a name." };
  if (!["public", "private"].includes(visibility)) return { error: "Invalid visibility." };

  const slug = slugify(name);

  const { error } = await supabase
    .from("channels")
    .insert({ name: name.trim(), description: description?.trim() || null, slug, visibility, created_by: user.id });

  if (error) {
    // Logged server-side so the actual Supabase error is visible in the
    // terminal — the generic message returned to the browser was
    // masking a real failure that couldn't be diagnosed from the UI
    // alone.
    console.error("createChannel insert failed:", error);
    if (error.code === "23505") {
      return { error: "A channel with a very similar name already exists — try a more distinct name." };
    }
    return { error: `Could not create the channel: ${error.message || "please try again."}` };
  }

  // Fetched as a SEPARATE follow-up query rather than chaining
  // .select().single() onto the insert itself — confirmed as the
  // actual root cause of the earlier RLS failure: chaining a select
  // makes Supabase build a single INSERT ... RETURNING statement,
  // where the RETURNING clause is subject to the table's SELECT
  // policy at a point in the same transaction where the
  // trigger-created channel_admins row wasn't yet resolving as visible
  // to that check. A separate query, run after the first transaction
  // has fully committed, sidesteps that timing issue entirely.
  const { data: created } = await supabase.from("channels").select("id").eq("slug", slug).single();

  revalidatePath(`/member/channels/${visibility}`);
  return { channelId: created?.id };
}

export async function createPost(channelId, content, attachment = null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!content?.trim() && !attachment) return { error: "Please write something or attach a file before posting." };

  const { error } = await supabase.from("discussion_posts").insert({
    channel_id: channelId,
    user_id: user.id,
    content: content?.trim() || "",
    attachment_url: attachment?.url ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_name: attachment?.name ?? null,
    attachment_size: attachment?.size ?? null,
  });

  if (error) return { error: "Could not post — please try again." };
  revalidatePath(`/member/channels/${channelId}`);
  return { success: true };
}

export async function createReply(channelId, parentPostId, content) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!content || !content.trim()) return { error: "Please write something before replying." };

  const { error } = await supabase.from("discussion_posts").insert({
    channel_id: channelId,
    user_id: user.id,
    content: content.trim(),
    parent_post_id: parentPostId,
  });

  if (error) return { error: "Could not post your reply — please try again." };
  revalidatePath(`/member/channels/${channelId}`);
  return { success: true };
}

export async function addChannelMember(channelId, identifier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!identifier || !identifier.trim()) return { error: "Please enter a username or email." };

  const clean = identifier.trim();
  // Matches by exact email or exact display name — case-insensitive on
  // display name since people rarely remember the exact casing of
  // someone else's chosen name.
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .or(`email.eq.${clean},display_name.ilike.${clean}`)
    .limit(1)
    .single();

  if (!targetProfile) {
    return { error: `No member found matching "${identifier}" — check the exact username or email.` };
  }

  // Checked explicitly rather than relying on a unique-constraint
  // error, since this insert now targets pending_requests, not
  // channel_members directly — someone already a member wouldn't
  // trigger a duplicate-key error there the way the old direct-insert
  // flow did.
  const { data: existingMembership } = await supabase
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", channelId)
    .eq("user_id", targetProfile.id)
    .single();
  if (existingMembership) {
    return { error: `${targetProfile.display_name || identifier} is already a member of this channel.` };
  }

  // Creates a pending invite rather than adding the member directly —
  // per explicit request, the invited person now needs to accept
  // before they're actually added, rather than being silently added
  // without their consent.
  const { error } = await supabase.from("pending_requests").insert({
    request_type: "channel_invite",
    channel_id: channelId,
    invited_user_id: targetProfile.id,
    invited_by: user.id,
  });

  if (error) {
    console.error("addChannelMember (pending_requests insert) failed:", error);
    if (error.code === "23505") {
      return { error: `${targetProfile.display_name || identifier} already has a pending invite to this channel.` };
    }
    return { error: "Could not send the invite — please try again." };
  }

  return { success: true, addedName: targetProfile.display_name || targetProfile.email };
}

export async function updateChannelCoverImage(channelId, coverImageUrl) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS enforces that only a channel admin can actually update this —
  // "channel admin" already correctly covers both cases needed here
  // (the creator for a private channel, or the super_admin creator for
  // a public one, since only super_admin can create public channels in
  // the first place), so no separate public/private branching is
  // needed in the permission logic itself.
  const { error } = await supabase
    .from("channels")
    .update({ cover_image_url: coverImageUrl })
    .eq("id", channelId);

  if (error) return { error: "Could not update the cover image — please try again." };
  revalidatePath(`/member/channels/${channelId}`);
  return { success: true };
}

export async function toggleChannelPin(channelId, pinned) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Upsert rather than update — most channels won't have a preference
  // row at all until the first time a user pins/unpins them, since
  // there's no default row created per channel per user the way
  // channel_members works.
  const { error } = await supabase
    .from("channel_sidebar_preferences")
    .upsert({ user_id: user.id, channel_id: channelId, pinned, updated_at: new Date().toISOString() });

  if (error) return { error: "Could not update pin status — please try again." };
  revalidatePath("/", "layout"); // sidebar renders in the root layout, needs a broad revalidate
  return { success: true };
}

export async function togglePostPin(postId, channelId, pinned) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS ("Channel admins can pin/unpin posts in their channel") is the
  // actual enforcement here — this update simply fails silently
  // (affecting zero rows) for a non-admin, rather than the action
  // needing its own separate permission check.
  const { error } = await supabase.from("discussion_posts").update({ is_pinned: pinned }).eq("id", postId);

  if (error) return { error: "Could not update pin status — please try again." };
  revalidatePath(`/member/channels/${channelId}`);
  return { success: true };
}

export async function flagPost(postId, reason) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("post_flags")
    .insert({ post_id: postId, flagged_by: user.id, reason: reason?.trim() || null });

  if (error) {
    // A duplicate flag from the same person on the same post is the
    // most likely real-world failure — no unique constraint exists to
    // catch this at the DB level here, so this stays a generic message
    // rather than a specific duplicate-detection branch.
    return { error: "Could not submit the flag — please try again." };
  }

  return { success: true };
}

export async function toggleLike(postId, channelId, liked) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (liked) {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    // A duplicate like (23505) is treated as a no-op success rather
    // than an error — this can genuinely happen if a double-click
    // fires two requests before the UI updates, and the end state
    // (liked) is correct either way.
    if (error && error.code !== "23505") return { error: "Could not like the post — please try again." };
  } else {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    if (error) return { error: "Could not remove your like — please try again." };
  }

  revalidatePath(`/member/channels/${channelId}`);
  return { success: true };
}
