"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

async function _requireSuperAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: caller } = await supabase.from("profiles").select("admin_role").eq("id", user.id).single();
  if (caller?.admin_role !== "super_admin") return { error: "Only super admins can do this." };
  return { user };
}

export async function fetchRoleDefinitions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_role_definitions")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data;
}

export async function updateRoleDefinition(roleKey, updates) {
  const supabase = await createClient();
  const auth = await _requireSuperAdmin(supabase);
  if (auth.error) return auth;

  // is_system_role and role_key itself are deliberately not editable
  // here, even by super_admin — role_key is the FK target every
  // profiles.admin_role value points at, and is_system_role is what
  // protects super_admin from being deleted later. Only the
  // presentation/permission fields below are ever touched by this
  // action, regardless of what the caller passes in.
  const allowedFields = {
    abbreviation: updates.abbreviation,
    label: updates.label,
    description: updates.description,
    badge_color: updates.badgeColor,
    permissions: updates.permissions,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("admin_role_definitions").update(allowedFields).eq("role_key", roleKey);
  if (error) return { error: "Could not update this role — please try again." };

  revalidatePath("/member/admin");
  revalidatePath("/", "layout"); // badges render on nearly every page
  return { success: true };
}

export async function createRoleDefinition({ roleKey, abbreviation, label, description, badgeColor }) {
  const supabase = await createClient();
  const auth = await _requireSuperAdmin(supabase);
  if (auth.error) return auth;

  const cleanKey = (roleKey || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (!cleanKey) return { error: "Please enter a role key (letters, numbers, underscores only)." };
  if (!abbreviation?.trim()) return { error: "Please enter an abbreviation, e.g. CA." };
  if (!label?.trim()) return { error: "Please enter a full label, e.g. Community Admin." };

  const { data: maxSort } = await supabase
    .from("admin_role_definitions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("admin_role_definitions").insert({
    role_key: cleanKey,
    abbreviation: abbreviation.trim(),
    label: label.trim(),
    description: description?.trim() || "",
    badge_color: badgeColor || "#9CA3AF",
    permissions: {},
    is_system_role: false,
    sort_order: (maxSort?.sort_order || 0) + 1,
  });

  if (error) {
    if (error.code === "23505") return { error: `A role with the key "${cleanKey}" already exists.` };
    return { error: "Could not create this role — please try again." };
  }

  revalidatePath("/member/admin");
  return { success: true };
}

export async function deleteRoleDefinition(roleKey) {
  const supabase = await createClient();
  const auth = await _requireSuperAdmin(supabase);
  if (auth.error) return auth;

  // RLS itself already blocks deleting is_system_role rows — this
  // check just returns a clear message instead of a generic RLS
  // failure if someone tries anyway.
  const { data: role } = await supabase
    .from("admin_role_definitions")
    .select("is_system_role")
    .eq("role_key", roleKey)
    .single();
  if (role?.is_system_role) return { error: "The Super Admin role can't be deleted." };

  const { error } = await supabase.from("admin_role_definitions").delete().eq("role_key", roleKey);
  if (error) return { error: "Could not delete this role — please try again." };

  revalidatePath("/member/admin");
  return { success: true };
}
