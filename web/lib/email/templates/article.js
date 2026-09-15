import * as React from "react";
import { BaseEmail, Heading, Body, Button, InfoBox, Divider, BRAND_COLOR, MUTED_COLOR } from "./base";

export function ArticleApprovedEmail({ displayName, articleTitle, channelName, articleUrl, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Your article has been approved — InfinityVolume" previewText={`"${articleTitle}" is now live in ${channelName}`}>
      <Heading>Article approved ✓</Heading>
      <Body>Hi {displayName}, your article has been reviewed and approved by our research team. It is now live in the channel.</Body>
      <InfoBox label="Article" value={articleTitle} />
      <InfoBox label="Published to" value={`🌐 ${channelName}`} />
      <Body>Members of the {channelName} channel can now read, like, and comment on your article.</Body>
      <Button href={articleUrl || `${platformUrl}/member/articles`}>View your article →</Button>
      <Divider />
      <Body style={{ fontSize: 12, color: MUTED_COLOR }}>Share it with your network — the article link is available from the channel page.</Body>
    </BaseEmail>
  );
}

export function ArticleChangesRequestedEmail({ displayName, articleTitle, channelName, reviewerComment, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Revisions requested on your article — InfinityVolume" previewText={`The review team left feedback on "${articleTitle}"`}>
      <Heading>Revisions requested</Heading>
      <Body>Hi {displayName}, the review team has read your article and left feedback before it can be published.</Body>
      <InfoBox label="Article" value={articleTitle} />
      <InfoBox label="Submitted to" value={channelName} />
      {reviewerComment && (
        <>
          <Divider />
          <p style={{ margin: "0 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>Reviewer note</p>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#a0a0a0", lineHeight: 1.7, fontStyle: "italic" }}>"{reviewerComment}"</p>
        </>
      )}
      <Body>Open your article in the editor to see all reviewer comments, make your revisions, and resubmit.</Body>
      <Button href={`${platformUrl}/member/publish`}>Open editor →</Button>
    </BaseEmail>
  );
}

export function ArticleRejectedEmail({ displayName, articleTitle, channelName, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Article submission update — InfinityVolume" previewText={`An update on your submission to ${channelName}`}>
      <Heading>Submission not approved</Heading>
      <Body>Hi {displayName}, after review, your article submission to {channelName} has not been approved for publication at this time.</Body>
      <InfoBox label="Article" value={articleTitle} />
      <InfoBox label="Channel" value={channelName} />
      <Body>Your article has been returned to your drafts. You can revise and resubmit, or submit to a different channel.</Body>
      <Button href={`${platformUrl}/member/drafts`}>View your drafts →</Button>
    </BaseEmail>
  );
}

export function PrivateChannelInviteEmail({ displayName, channelName, invitedByName, channelId, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title={`You've been added to ${channelName} — InfinityVolume`} previewText={`${invitedByName} added you to a private channel`}>
      <Heading>Private channel access</Heading>
      <Body>Hi {displayName}, you've been added to a private channel on InfinityVolume.</Body>
      <InfoBox label="Channel" value={`🔒 ${channelName}`} />
      <InfoBox label="Added by" value={invitedByName} />
      <Body>Private channels are invite-only spaces visible only to their members. You can post, read articles, and engage with other channel members.</Body>
      <Button href={`${platformUrl}/member/channels/${channelId}`}>Open channel →</Button>
    </BaseEmail>
  );
}
