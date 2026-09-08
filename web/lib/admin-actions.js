"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

// Deliberately does NOT allow assigning 'super_admin' through this
// action — only 'technical', 'research', or null (removing a role) —
// per explicit scope. Granting the highest privilege level stays a
// manual, direct database action, not something exposed through a UI
// button that could be misclicked.
const ASSIGNABLE_ROLES = ["technical", "research", null];

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

  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: "That role can't be assigned through this action." };
  }

  const { error } = await supabase.from("profiles").update({ admin_role: newRole }).eq("id", targetUserId);
  if (error) {
    return { error: "Could not update the role — please try again." };
  }

  revalidatePath("/member/admin");
  return { success: true };
}
