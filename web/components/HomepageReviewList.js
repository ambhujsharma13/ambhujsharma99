"use client";
import { useState } from "react";
import ReviewQueueItem from "./ReviewQueueItem";

function SaveButton({ pending, onSave }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  async function handle() {
    setSaving(true);
    setResult(null);
    try {
      await onSave();
      setResult("saved");
    } catch (e) {
      setResult("error: " + e.message);
    }
    setSaving(false);
    setTimeout(() => setResult(null), 4000);
  }

  if (!pending && !result) return null;

  return (
    <button
      onClick={handle}
      disabled={saving}
      className={`text-xs font-body px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 ${
        result === "saved"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : result?.startsWith("error")
          ? "bg-loss/20 text-loss border border-loss/30"
          : "bg-brass-400 text-ink-950 hover:bg-brass-300"
      }`}
    >
      {saving ? "Saving…" : result === "saved" ? "✓ Saved to Homepage" : result?.startsWith("error") ? "⚠ " + result : "Save Changes"}
    </button>
  );
}

export default function HomepageReviewList({
  reviewed, channelsByArticle, commentsBySubmission, reviewerId, isSA, homepageArticleIds
}) {
  const [draftHomepage, setDraftHomepage] = useState(new Set(homepageArticleIds));
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  function toggle(articleId) {
    setDraftHomepage(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else if (next.size < 10) {
        next.add(articleId);
      }
      return next;
    });
    setHasPendingChanges(true);
  }

  async function handleSave() {
    const resp = await fetch("/api/homepage-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIds: [...draftHomepage] }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    setHasPendingChanges(false);
  }

  return (
    <>
      {/* Fixed save button top-right */}
      {isSA && (
        <div className="fixed top-4 right-6 z-50">
          <SaveButton pending={hasPendingChanges} onSave={handleSave} />
        </div>
      )}

      <div className="space-y-3">
        {reviewed.map(sub => {
          const isPublicApproved = sub.status === "approved" &&
            (channelsByArticle[sub.article_id] || []).some(
              ch => ch.visibility === "public" && ch.status === "approved"
            );
          const onHomepage = draftHomepage.has(sub.article_id);

          return (
            <div key={sub.id} className={`flex items-start gap-3 ${isSA && isPublicApproved ? "" : ""}`}>
              <div className="flex-1 min-w-0">
                <ReviewQueueItem
                  submission={sub}
                  allChannels={channelsByArticle[sub.article_id] || []}
                  comments={commentsBySubmission[sub.id] || []}
                  reviewerId={reviewerId}
                  compact
                />
              </div>
              {/* SA homepage column */}
              {isSA && isPublicApproved && (
                <div className="shrink-0 flex flex-col items-end justify-start gap-1.5 pt-3 min-w-[130px]">
                  {onHomepage ? (
                    <>
                      <div className="flex items-center gap-1 text-[10px] font-body text-brass-400">
                        <span>📌</span>
                        <span>On Homepage</span>
                      </div>
                      <button
                        onClick={() => toggle(sub.article_id)}
                        className="text-[10px] font-body text-paper/30 hover:text-loss transition-colors underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggle(sub.article_id)}
                      disabled={draftHomepage.size >= 10}
                      className="text-[10px] font-body px-2.5 py-1.5 rounded border bg-ink-800 text-paper/50 border-ink-700 hover:bg-brass-400/10 hover:text-brass-400 hover:border-brass-400/30 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {draftHomepage.size >= 10 ? "Full (10/10)" : "Add to Homepage"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom save bar */}
      {isSA && hasPendingChanges && (
        <div className="mt-6 pt-4 border-t border-ink-800 flex justify-end">
          <SaveButton pending={hasPendingChanges} onSave={handleSave} />
        </div>
      )}
    </>
  );
}
