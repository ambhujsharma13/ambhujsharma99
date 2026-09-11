"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function setAdminRole(targetUserId, newRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("admin_role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.admin_role !== "super_admin") {
    return { error: "Only super admins can change member roles." };
  }

  // Confirmed real gap this replaces: the previous hardcoded
  // ["technical", "research", null] array meant a genuinely new role
  // (like the planned "community" one) needed a code change here
  // just to become assignable, on top of being defined in
  // admin_role_definitions. Now reads the valid, non-system role keys
  // directly from that table instead — is_system_role = false is what
  // excludes 'super_admin' from ever being assignable through this
  // action, the same safety property the old hardcoded list had,
  // just expressed as data instead of code. Granting the highest
  // privilege level stays a manual, direct database action.
  if (newRole !== null) {
    const { data: validRole } = await supabase
      .from("admin_role_definitions")
      .select("role_key")
      .eq("role_key", newRole)
      .eq("is_system_role", false)
      .single();
    if (!validRole) {
      return { error: "That role can't be assigned through this action." };
    }
  }

  const { error } = await supabase.from("profiles").update({ admin_role: newRole }).eq("id", targetUserId);
  if (error) {
    return { error: "Could not update the role — please try again." };
  }

  revalidatePath("/member/admin");
  revalidatePath("/", "layout"); // badges render on nearly every page
  return { success: true };
}
