"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["available", "away", "dnd", "invisible"];

export async function updateAvatar(presetId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("profiles").update({ avatar_url: presetId }).eq("id", user.id);
  if (error) return { error: "Could not update your avatar — please try again." };

  revalidatePath("/", "layout"); // avatar shows in the sidebar user panel on every page
  return { success: true };
}

export async function updateStatus(status) {
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("profiles").update({ status }).eq("id", user.id);
  if (error) return { error: "Could not update your status — please try again." };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updatePublicProfile({
  displayName,
  bio,
  linkedinUrl,
  professionalTitle,
  tagline,
  currentJobRole,
  socials,
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // display_name deliberately included here too — this modal doubles
  // as the "editable display name" Settings item that was already on
  // the Phase 1 list, rather than building a second, separate place to
  // change the same field.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName?.trim() || null,
      bio: bio?.trim() || null,
      linkedin_url: linkedinUrl?.trim() || null,
      professional_title: professionalTitle?.trim() || null,
      tagline: tagline?.trim() || null,
      current_job_role: currentJobRole?.trim() || null,
      socials: socials || {},
    })
    .eq("id", user.id);

  if (error) return { error: "Could not update your profile — please try again." };

  revalidatePath("/", "layout");
  return { success: true };
}
