"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptRequest(requestId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Fetched first (rather than blindly updating) because accepting
  // needs to know which table to actually grant access in afterward —
  // channel_members for a channel invite, article_collaborators for a
  // collaborator invite. RLS ("Only the invited person can update
  // their own request") still covers the update itself below.
  const { data: request, error: fetchError } = await supabase
    .from("pending_requests")
    .select("id, request_type, channel_id, article_id, invited_user_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { error: "That request could not be found." };
  if (request.invited_user_id !== user.id) return { error: "This request isn't yours to act on." };
  if (request.status !== "pending") return { error: "This request has already been resolved." };

  if (request.request_type === "channel_invite") {
    const { error } = await supabase
      .from("channel_members")
      .insert({ channel_id: request.channel_id, user_id: user.id });
    if (error) return { error: "Could not join the channel — please try again." };
  } else {
    const { error } = await supabase
      .from("article_collaborators")
      .insert({ article_id: request.article_id, user_id: user.id });
    if (error) return { error: "Could not add you as a collaborator — please try again." };
  }

  const { error: updateError } = await supabase
    .from("pending_requests")
    .update({ status: "accepted", seen_at: new Date().toISOString(), resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) return { error: "Joined, but could not update the request's status — please refresh." };

  revalidatePath("/member/settings");
  // Confirmed real gap: this only ever revalidated /member/settings —
  // a collaborator invite acceptance never invalidated /member/drafts
  // (where the newly-shared article should appear) or /member/articles
  // (if it was already published), so a stale cached render could keep
  // showing zero shared items even though the underlying row existed.
  if (request.request_type === "collaborator_invite") {
    revalidatePath("/member/drafts");
    revalidatePath("/member/articles");
  }
  if (request.request_type === "channel_invite") revalidatePath(`/member/channels/${request.channel_id}`);
  return { success: true };
}

export async function denyRequest(requestId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("pending_requests")
    .update({ status: "denied", seen_at: new Date().toISOString(), resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("invited_user_id", user.id);

  if (error) return { error: "Could not deny the request — please try again." };
  revalidatePath("/member/settings");
  return { success: true };
}

// "Wait" — explicitly does NOT change status (stays 'pending'), only
// records that the person has seen it, so the yellow "unattended"
// indicator clears without forcing an accept/deny decision right now.
export async function markRequestSeen(requestId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("pending_requests")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("invited_user_id", user.id);

  if (error) return { error: "Could not update the request — please try again." };
  revalidatePath("/member/settings");
  return { success: true };
}
