import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import AvatarDisplay from "../../../../components/AvatarDisplay";
import MessageComposer from "../../../../components/MessageComposer";
import { toggleDirectMessagePin } from "../../../../lib/pin-actions";

function formatTimestamp(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(b) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentBubble({ url, type, name, size, isOwn }) {
  if (!url) return null;
  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img src={url} alt={name} className="max-h-48 rounded-lg object-contain" />
      </a>
    );
  }
  const icons = { pdf: "📄", spreadsheet: "📊", presentation: "📽️", document: "📝", file: "📎" };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-body hover:opacity-80 transition-opacity w-fit max-w-full ${
        isOwn ? "bg-ink-950/20" : "bg-ink-700"
      }`}
    >
      <span>{icons[type] ?? "📎"}</span>
      <span className="truncate max-w-[160px]">{name}</span>
      {size && <span className="opacity-60 shrink-0">{formatBytes(size)}</span>}
    </a>
  );
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
    .select("id, sender_id, recipient_id, content, is_system_notification, is_pinned, attachment_url, attachment_type, attachment_name, attachment_size, created_at")
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
              <div key={m.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"} group`}>
                {m.is_pinned && (
                  <span className="text-brass-400 text-[10px] font-body mb-0.5">📌 Pinned</span>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn ? "bg-brass-400 text-ink-950" : "bg-ink-800 text-paper/90"
                  }`}
                >
                  {m.content && (
                    <p className="text-sm font-body whitespace-pre-wrap">{m.content}</p>
                  )}
                  <AttachmentBubble
                    url={m.attachment_url}
                    type={m.attachment_type}
                    name={m.attachment_name}
                    size={m.attachment_size}
                    isOwn={isOwn}
                  />
                  <p className={`text-[10px] font-body mt-1 ${isOwn ? "text-ink-950/60" : "text-paper/30"}`}>
                    {formatTimestamp(m.created_at)}
                  </p>
                </div>
                <form action={toggleDirectMessagePin.bind(null, m.id, m.is_pinned)} className="hidden group-hover:flex mt-0.5">
                  <button type="submit" className="text-paper/20 hover:text-brass-400 text-[10px] font-body transition-colors">
                    {m.is_pinned ? "Unpin" : "Pin"}
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer recipientId={otherId} />
    </main>
  );
}
