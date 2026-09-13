"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

export async function submitSupportTicket({ ticketType, title, description, affectedTicker, affectedPageUrl }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!title?.trim()) return { error: "Please add a title." };
  if (!description?.trim()) return { error: "Please describe the issue." };

  const { error } = await supabase.from("support_tickets").insert({
    submitted_by: user.id,
    ticket_type: ticketType,
    title: title.trim(),
    description: description.trim(),
    affected_ticker: affectedTicker?.trim() || null,
    affected_page_url: affectedPageUrl?.trim() || null,
  });

  if (error) return { error: "Could not submit ticket — please try again." };
  revalidatePath("/member/support");
  revalidatePath("/member/admin/support");
  return { success: true };
}

export async function updateTicketStatus(ticketId, status, taNotes) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      ta_notes: taNotes || null,
      assignee_id: user.id,
      resolved_at: ["resolved", "wont_fix", "duplicate"].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) return { error: "Could not update ticket." };
  revalidatePath("/member/admin/support");
  return { success: true };
}

export async function toggleTicketVote(ticketId, currentlyVoted) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (currentlyVoted) {
    await supabase.from("support_ticket_votes").delete()
      .eq("ticket_id", ticketId).eq("user_id", user.id);
  } else {
    await supabase.from("support_ticket_votes").insert({ ticket_id: ticketId, user_id: user.id });
  }

  revalidatePath("/member/support");
  revalidatePath("/member/admin/support");
  return { voted: !currentlyVoted };
}

export async function updatePostFlagStatus(flagId, status) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("post_flags")
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", flagId);

  if (error) return { error: "Could not update flag." };
  revalidatePath("/member/admin/flags");
  return { success: true };
}
