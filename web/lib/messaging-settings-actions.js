"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMessagingPermissions({ allowFromContacts, allowFromAnyone, filterUnknownSenders }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      allow_messages_from_contacts: allowFromContacts,
      allow_messages_from_anyone: allowFromAnyone,
      filter_unknown_senders: filterUnknownSenders,
    })
    .eq("id", user.id);

  if (error) return { error: "Could not update messaging settings — please try again." };
  revalidatePath("/member/settings");
  return { success: true };
}
