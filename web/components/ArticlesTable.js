"use client";

import { useState } from "react";
import Link from "next/link";
import SortableHeader, { sortRows, nextSortState } from "./SortableHeader";

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

export default function ArticlesTable({ articles, emptyMessage, dateLabel = "Updated", editHref = "/member/publish" }) {
  const [sort, setSort] = useState({ key: null, direction: "desc" });

  function handleSort(key) {
    setSort((current) => nextSortState(current, key, key === "title" || key === "author"));
  }

  if (!articles || articles.length === 0) {
    return <p className="text-paper/40 font-body text-sm">{emptyMessage}</p>;
  }

  const sorted = sortRows(articles, sort, getValue);

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
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-800">
        {sorted.map((article) => (
          <tr key={article.id} className="hover:bg-ink-800/40 transition-colors">
            <td className="py-3 pr-4">
              <Link href={`${editHref}?id=${article.id}`} className="text-paper/80 hover:text-brass-400">
                {article.title || "Untitled"}
              </Link>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
