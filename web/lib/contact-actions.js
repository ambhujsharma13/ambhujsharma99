"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

// Shared by both addContact (by username/email) and addContactById (by
// exact profile id, used from a public profile page where the id is
// already known) — extracted rather than duplicated.
//
// Confirmed real behavior change: this used to insert directly into
// contacts (immediate, no acceptance needed). Now creates a
// pending_requests row instead, going through the same accept/deny
// mechanism already built for channel and collaborator invites, shown
// in the same Settings / Requests inbox rather than a separate
// mechanism. See acceptRequest() in request-actions.js for what
// happens on acceptance.
async function _createContactRequest(supabase, user, targetProfile) {
  if (targetProfile.id === user.id) {
    return { error: "You can't add yourself as a contact." };
  }

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("contact_id", targetProfile.id)
    .single();
  if (existingContact) {
    return { error: `${targetProfile.display_name || "This person"} is already in your contacts.` };
  }

  const { error } = await supabase.from("pending_requests").insert({
    request_type: "contact_invite",
    invited_user_id: targetProfile.id,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: `${targetProfile.display_name || "This person"} already has a pending contact request from you.`,
      };
    }
    return { error: "Could not send the contact request — please try again." };
  }

  return { success: true, addedName: targetProfile.display_name || targetProfile.email };
}

export async function addContact(identifier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!identifier || !identifier.trim()) return { error: "Please enter a username or email." };

  const clean = identifier.trim();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .or(`email.eq.${clean},display_name.ilike.${clean}`)
    .limit(1)
    .single();

  if (!targetProfile) {
    return { error: `No member found matching "${identifier}" — check the exact username or email.` };
  }

  return _createContactRequest(supabase, user, targetProfile);
}

// Used from a public profile page (via AddContactButton), where the
// exact profile id is already known — skips the username/email lookup
// addContact() needs.
export async function addContactById(targetId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", targetId)
    .single();

  if (!targetProfile) return { error: "That member could not be found." };

  return _createContactRequest(supabase, user, targetProfile);
}

export async function removeContact(contactId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Removes both directions in one call — since Accept now establishes
  // the relationship both ways at once, removal undoes it both ways
  // too, rather than leaving a one-sided remnant. Requires the updated
  // delete policy ("Either party can remove either direction") — the
  // original policy only allowed deleting rows where the current user
  // was user_id, which would have silently left the other direction's
  // row in place.
  const { error } = await supabase
    .from("contacts")
    .delete()
    .or(
      `and(user_id.eq.${user.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${user.id})`
    );

  if (error) return { error: "Could not remove that contact — please try again." };
  revalidatePath("/", "layout");
  return { success: true };
}
