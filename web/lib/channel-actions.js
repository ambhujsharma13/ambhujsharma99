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

  // Temporary diagnostic — checking what auth.uid() actually returns
  // FROM THE DATABASE'S OWN PERSPECTIVE, via the same client used for
  // the insert, since user.id from getUser() looking correct doesn't
  // guarantee it matches what the database sees during the actual
  // write — these are two different mechanisms (auth server validation
  // vs. the JWT claims PostgREST uses for the request).
  const { data: uidCheck } = await supabase.rpc("get_current_uid_for_debug");
  console.log("createChannel attempt:", { userId: user.id, dbAuthUid: uidCheck, visibility, slug });

  const { data, error } = await supabase
    .from("channels")
    .insert({ name: name.trim(), description: description?.trim() || null, slug, visibility, created_by: user.id });
  // Temporarily removed .select("id").single() to test whether the
  // RETURNING clause (which is subject to the SELECT policy, not just
  // the INSERT policy) is the actual source of the RLS violation,
  // rather than the insert's own with-check clause.

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

  revalidatePath(`/member/channels/${visibility}`);
  return { success: true }; // temporary — data.id isn't available without the select-back being tested here
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
