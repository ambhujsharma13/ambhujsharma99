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

export async function createPost(channelId, content) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!content || !content.trim()) return { error: "Please write something before posting." };

  const { error } = await supabase.from("discussion_posts").insert({
    channel_id: channelId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: "Could not post — please try again." };
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

  const { error } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: targetProfile.id });

  if (error) {
    console.error("addChannelMember insert failed:", error);
    if (error.code === "23505") {
      return { error: `${targetProfile.display_name || identifier} is already a member of this channel.` };
    }
    return { error: "Could not add that member — please try again." };
  }

  revalidatePath(`/member/channels/${channelId}`);
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
