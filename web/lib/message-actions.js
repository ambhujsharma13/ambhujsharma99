"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function sendDirectMessage(recipientId, content, attachment = null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!content?.trim() && !attachment) return { error: "Please write something or attach a file before sending." };
  if (recipientId === user.id) return { error: "You can't message yourself." };

  const { data: allowed } = await supabase.rpc("can_message", {
    p_sender_id: user.id,
    p_recipient_id: recipientId,
  });
  if (!allowed) {
    return { error: "This person isn't accepting messages from you right now." };
  }

  const { error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content?.trim() || "",
      attachment_url: attachment?.url ?? null,
      attachment_type: attachment?.type ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_size: attachment?.size ?? null,
    });

  if (error) return { error: "Could not send — please try again." };
  revalidatePath(`/member/inbox/${recipientId}`);
  revalidatePath("/member/inbox");
  return { success: true };
}
