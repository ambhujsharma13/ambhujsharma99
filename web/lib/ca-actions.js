"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

// ─── Post moderation ──────────────────────────────────────────────────────────

export async function hidePost(postId, hide = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("discussion_posts")
    .update({
      is_hidden: hide,
      hidden_by: hide ? user.id : null,
      hidden_at: hide ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (error) return { error: "Could not update post visibility." };
  revalidatePath("/member/channels/[channelId]", "page");
  return { success: true, hidden: hide };
}

export async function lockPost(postId, lock = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("discussion_posts")
    .update({
      is_locked: lock,
      locked_by: lock ? user.id : null,
      locked_at: lock ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (error) return { error: "Could not update post lock status." };
  revalidatePath("/member/channels/[channelId]", "page");
  return { success: true, locked: lock };
}

// ─── Omega boost ─────────────────────────────────────────────────────────────

const MAX_BOOSTS_PER_CA = 3;

export async function grantOmegaBoost(recipientId, reason = "") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (user.id === recipientId) return { error: "You cannot boost your own Omega score." };

  // Check CA hasn't exceeded their 3-boost limit
  const { count } = await supabase
    .from("omega_boosts")
    .select("id", { count: "exact", head: true })
    .eq("granted_by", user.id);

  if ((count || 0) >= MAX_BOOSTS_PER_CA) {
    return { error: `You have reached your limit of ${MAX_BOOSTS_PER_CA} active boosts. Revoke one before granting another.` };
  }

  const { error } = await supabase.from("omega_boosts").insert({
    recipient_id: recipientId,
    granted_by: user.id,
    boost_points: 5,
    reason: reason.trim() || null,
  });

  if (error?.code === "23505") return { error: "This member has already received a community boost." };
  if (error) return { error: "Could not grant boost — please try again." };

  revalidatePath(`/member/profile/${recipientId}`);
  revalidatePath("/member/admin/community");
  return { success: true };
}

export async function revokeOmegaBoost(recipientId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("omega_boosts")
    .delete()
    .eq("recipient_id", recipientId)
    .or(`granted_by.eq.${user.id},granted_by.neq.${user.id}`); // SA can revoke any; CA can only revoke own (enforced by RLS)

  if (error) return { error: "Could not revoke boost." };
  revalidatePath(`/member/profile/${recipientId}`);
  revalidatePath("/member/admin/community");
  return { success: true };
}

// Fetch CA's current boost usage
export async function getCABoostUsage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { used: 0, max: MAX_BOOSTS_PER_CA, boosts: [] };

  const { data } = await supabase
    .from("omega_boosts")
    .select("id, recipient_id, reason, created_at, profiles!omega_boosts_recipient_id_fkey(display_name, omega_score)")
    .eq("granted_by", user.id)
    .order("created_at", { ascending: false });

  return { used: (data || []).length, max: MAX_BOOSTS_PER_CA, boosts: data || [] };
}
