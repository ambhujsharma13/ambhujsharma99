import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import AvatarDisplay from "../../../../components/AvatarDisplay";
import MessageComposer from "../../../../components/MessageComposer";

function formatTimestamp(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ConversationPage({ params }) {
  const { userId: otherId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }
  if (otherId === user.id) {
    notFound();
  }

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", otherId)
    .single();

  if (!otherProfile) {
    notFound();
  }

  // Same 90-day display-filter window as the inbox list — a
  // conversation opened from that list shouldn't show a different set
  // of messages than what the preview implied.
  const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, is_system_notification, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
    )
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-ink-800 mb-4">
        <AvatarDisplay avatarUrl={otherProfile.avatar_url} displayName={otherProfile.display_name} size={36} />
        <h1 className="font-display text-lg text-paper">{otherProfile.display_name || "Member"}</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-4">
        {(messages || []).length === 0 ? (
          <p className="text-paper/40 font-body text-sm">
            No messages yet — say hello to start the conversation.
          </p>
        ) : (
          (messages || []).map((m) => {
            if (m.is_system_notification) {
              return (
                <div key={m.id} className="text-center py-2">
                  <p className="text-paper/40 text-xs font-body italic">{m.content}</p>
                </div>
              );
            }
            const isOwn = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn ? "bg-brass-400 text-ink-950" : "bg-ink-800 text-paper/90"
                  }`}
                >
                  <p className="text-sm font-body whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] font-body mt-1 ${isOwn ? "text-ink-950/60" : "text-paper/30"}`}>
                    {formatTimestamp(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer recipientId={otherId} />
    </main>
  );
}
