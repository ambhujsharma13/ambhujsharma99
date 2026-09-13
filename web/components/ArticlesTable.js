"use client";

import { useState } from "react";
import Link from "next/link";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";
import BookmarkButton from "./BookmarkButton";
import InlinePinButton from "./InlinePinButton";
import { toggleArticlePin } from "../lib/pin-actions";

function getValue(article, key) {
  switch (key) {
    case "title":
      return article.title || "Untitled";
    case "author":
      return article.authorName || "";
    case "wordCount":
      return article.wordCount;
    case "date":
      return new Date(article.dateValue).getTime();
    default:
      return null;
  }
}

export default function ArticlesTable({ articles, emptyMessage, dateLabel = "Updated", editHref = "/member/publish", showPin = false }) {
  const [sort, setSort] = useState({ key: null, direction: "desc" });

  function handleSort(key) {
    setSort((current) => nextSortState(current, key, key === "title" || key === "author"));
  }

  if (!articles || articles.length === 0) {
    return <p className="text-paper/40 font-body text-sm">{emptyMessage}</p>;
  }

  // Pinned articles float to top, rest sorted as normal
  const sorted = sortRows(articles, sort, getValue);
  const pinned = sorted.filter((a) => a.is_pinned);
  const unpinned = sorted.filter((a) => !a.is_pinned);
  const displayed = [...pinned, ...unpinned];

  return (
    <table className="w-full text-sm font-body">
      <thead className="border-b border-ink-800 text-paper/40 text-xs uppercase tracking-wide">
        <tr>
          <SortableHeader label="Title" sortKey="title" currentSort={sort} onSort={handleSort} />
          <SortableHeader label="Author" sortKey="author" currentSort={sort} onSort={handleSort} />
          <th className="py-3 pr-4 font-medium text-left">Collaborators</th>
          <th className="py-3 pr-4 font-medium text-left">Tags</th>
          <SortableHeader label="Words" sortKey="wordCount" currentSort={sort} onSort={handleSort} align="right" />
          <SortableHeader label={dateLabel} sortKey="date" currentSort={sort} onSort={handleSort} align="right" />
          <th className="py-3 font-medium text-right w-16"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-800">
        {displayed.map((article) => (
          <tr key={article.id} className={`hover:bg-ink-800/40 transition-colors ${article.is_pinned ? "bg-ink-900/60" : ""}`}>
            <td className="py-3 pr-4">
              <div className="flex items-center gap-1.5">
                {article.is_pinned && <span className="text-brass-400 text-xs">📌</span>}
                <Link href={`${editHref}?id=${article.id}`} className="text-paper/80 hover:text-brass-400">
                  {article.title || "Untitled"}
                </Link>
              </div>
              {article.isOwner === false && (
                <p className="text-[11px] font-body text-yellow-500/70 mt-0.5 leading-snug">
                  ⚠ This article was created by {article.authorName || "another author"} — only they can publish it.
                  You can edit as a collaborator, or{" "}
                  <Link href="/member/publish" className="underline hover:text-yellow-400">
                    create your own
                  </Link>.
                </p>
              )}
              {article.submissions && article.submissions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {article.submissions.map((s, i) => {
                    const styles = {
                      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                      approved: "bg-gain/10 text-gain border-gain/20",
                      changes_requested: "bg-brass-400/10 text-brass-400 border-brass-400/20",
                      rejected: "bg-loss/10 text-loss border-loss/20",
                    };
                    const labels = {
                      pending: "🕐 In review",
                      approved: "✓ Approved",
                      changes_requested: "↩ Changes requested",
                      rejected: "✕ Rejected",
                    };
                    return (
                      <span key={i} className={`text-[10px] font-body px-1.5 py-0.5 rounded border ${styles[s.status] || styles.pending}`}>
                        {labels[s.status] || s.status} {s.channelName ? `· ${s.channelName}` : ""}
                      </span>
                    );
                  })}
                </div>
              )}
            </td>
            <td className="py-3 pr-4 text-paper/60">{article.authorName || "—"}</td>
            <td className="py-3 pr-4 text-paper/60">
              {article.collaboratorNames && article.collaboratorNames.length > 0
                ? article.collaboratorNames.join(", ")
                : "—"}
            </td>
            <td className="py-3 pr-4 text-paper/60">
              {article.tags && article.tags.length > 0 ? article.tags.join(", ") : "—"}
            </td>
            <td className="py-3 pr-4 text-paper/60 text-right">{article.wordCount}</td>
            <td className="py-3 pr-4 text-paper/30 text-xs text-right">
              {new Date(article.dateValue).toLocaleDateString()}
            </td>
            <td className="py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                {showPin && (
                  <InlinePinButton
                    isPinned={article.is_pinned}
                    title="Pin to top"
                    onToggle={(currentlyPinned) => toggleArticlePin(article.id, currentlyPinned)}
                  />
                )}
                <BookmarkButton articleId={article.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
