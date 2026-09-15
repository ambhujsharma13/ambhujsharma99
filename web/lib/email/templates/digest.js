import * as React from "react";
import { BaseEmail, Heading, Body, Button, Divider, BRAND_COLOR, MUTED_COLOR } from "./base";

export function AuthorDigestEmail({ displayName, articles, periodLabel = "last 48 hours", platformUrl = "https://www.infinityvolume.com" }) {
  const totalComments = articles.reduce((s, a) => s + a.newComments, 0);
  const totalLikes = articles.reduce((s, a) => s + a.newLikes, 0);
  const totalReactions = totalComments * 2 + totalLikes;

  return (
    <BaseEmail
      title={`Your InfinityVolume engagement digest`}
      previewText={`${totalComments} new comment${totalComments !== 1 ? "s" : ""} and ${totalLikes} new like${totalLikes !== 1 ? "s" : ""} across your articles`}
    >
      <Heading>Your publishing digest</Heading>
      <Body>Hi {displayName}, here's a summary of engagement on your articles over the {periodLabel}.</Body>

      {/* Summary row */}
      <table cellPadding="0" cellSpacing="0" width="100%" style={{ margin: "16px 0 24px" }}>
        <tr>
          {[
            { label: "Comments", value: totalComments },
            { label: "Likes", value: totalLikes },
            { label: "Reactions", value: totalReactions },
          ].map(({ label, value }) => (
            <td key={label} width="33%" style={{ textAlign: "center", backgroundColor: "#0f0f0f", border: "1px solid #1f1f1f", borderRadius: 8, padding: "16px 8px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: BRAND_COLOR, fontFamily: "Georgia, serif" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
            </td>
          ))}
        </tr>
      </table>

      <Divider />

      {/* Per article */}
      {articles.map((article, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <a href={article.url || `${platformUrl}/member/articles`} style={{ fontSize: 15, fontWeight: 600, color: "#e8e6e0", textDecoration: "none" }}>
            {article.title}
          </a>
          <div style={{ marginTop: 6, display: "flex", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#666" }}>💬 {article.newComments} comment{article.newComments !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 13, color: "#666" }}>♡ {article.newLikes} like{article.newLikes !== 1 ? "s" : ""}</span>
          </div>
          {article.recentComments?.length > 0 && (
            <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #222" }}>
              {article.recentComments.slice(0, 2).map((c, j) => (
                <div key={j} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{c.author}</span>
                  <span style={{ fontSize: 12, color: "#666" }}> — {c.content?.slice(0, 100)}{c.content?.length > 100 ? "…" : ""}</span>
                </div>
              ))}
            </div>
          )}
          {i < articles.length - 1 && <Divider />}
        </div>
      ))}

      <Button href={`${platformUrl}/member/articles`}>View all your articles →</Button>
      <p style={{ marginTop: 20, fontSize: 11, color: MUTED_COLOR, textAlign: "center" }}>
        This digest is sent every 48 hours when you have engagement. Manage your notification preferences in account settings.
      </p>
    </BaseEmail>
  );
}
