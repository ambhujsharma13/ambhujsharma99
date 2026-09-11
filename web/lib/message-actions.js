"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function sendDirectMessage(recipientId, content) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!content || !content.trim()) return { error: "Please write something before sending." };
  if (recipientId === user.id) return { error: "You can't message yourself." };

  // RLS ("Can only send if the recipient's messaging permissions allow
  // it") is the actual enforcement here, via the same can_message()
  // function — checked again explicitly first so a blocked send returns
  // a real, specific message instead of a generic RLS insert failure.
  const { data: allowed } = await supabase.rpc("can_message", {
    p_sender_id: user.id,
    p_recipient_id: recipientId,
  });
  if (!allowed) {
    return { error: "This person isn't accepting messages from you right now." };
  }

  const { error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, content: content.trim() });

  if (error) return { error: "Could not send — please try again." };
  revalidatePath(`/member/inbox/${recipientId}`);
  revalidatePath("/member/inbox");
  return { success: true };
}
