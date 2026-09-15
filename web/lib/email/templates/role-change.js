import * as React from "react";
import { BaseEmail, Heading, Body, Button, InfoBox, Divider, BRAND_COLOR, MUTED_COLOR } from "./base";

const ROLE_LABELS = {
  super_admin: "Super Admin (SA)",
  research: "Research Analyst (RA)",
  technical: "Technical Admin (TA)",
  community: "Community Admin (CA)",
};

const ROLE_DESC = {
  super_admin: "You have full platform access including article review, homepage curation, channel management, and all admin capabilities.",
  research: "You can review and approve article submissions for public channels, manage the Human Intel research queue, and respond to member research questions.",
  technical: "You have technical admin access to manage platform configuration and settings.",
  community: "You can moderate discussion posts, manage the Human Intel research queue, boost member Omega scores, and oversee community health.",
};

export function RoleAssignedEmail({ displayName, newRole, platformUrl = "https://www.infinityvolume.com" }) {
  const label = ROLE_LABELS[newRole] || newRole;
  const desc = ROLE_DESC[newRole] || "You have been assigned a new admin role.";
  return (
    <BaseEmail title={`You've been assigned the ${label} role — InfinityVolume`} previewText={`You now have ${label} access on InfinityVolume`}>
      <Heading>New role assigned</Heading>
      <Body>Hi {displayName}, your InfinityVolume account has been updated with a new admin role.</Body>
      <InfoBox label="Role assigned" value={label} />
      <Body>{desc}</Body>
      <Divider />
      <Body style={{ fontSize: 13, color: MUTED_COLOR }}>If you have questions about your new responsibilities, contact the Super Admin team.</Body>
      <Button href={`${platformUrl}/member`}>Go to your dashboard →</Button>
    </BaseEmail>
  );
}

export function RoleChangedEmail({ displayName, oldRole, newRole, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Your role has been updated — InfinityVolume" previewText={`Your role changed from ${ROLE_LABELS[oldRole] || oldRole} to ${ROLE_LABELS[newRole] || newRole}`}>
      <Heading>Role updated</Heading>
      <Body>Hi {displayName}, your admin role on InfinityVolume has been updated.</Body>
      <InfoBox label="Previous role" value={ROLE_LABELS[oldRole] || oldRole} />
      <InfoBox label="New role" value={ROLE_LABELS[newRole] || newRole} />
      <Body>{ROLE_DESC[newRole] || "Your access level has changed."}</Body>
      <Button href={`${platformUrl}/member`}>Go to your dashboard →</Button>
    </BaseEmail>
  );
}

export function RoleRemovedEmail({ displayName, removedRole, platformUrl = "https://www.infinityvolume.com" }) {
  const label = ROLE_LABELS[removedRole] || removedRole;
  return (
    <BaseEmail title="Admin access removed — InfinityVolume" previewText={`Your ${label} access has been removed`}>
      <Heading>Admin access removed</Heading>
      <Body>Hi {displayName}, your {label} admin access on InfinityVolume has been removed.</Body>
      <Body>You continue to have access to all standard member features. If you believe this was a mistake, please contact your platform administrator.</Body>
      <Button href={`${platformUrl}/member`}>Go to your account →</Button>
    </BaseEmail>
  );
}

export function TierUpgradeEmail({ displayName, oldTier, newTier, platformUrl = "https://www.infinityvolume.com" }) {
  const TIER_LABELS = { member: "Member", captain: "Captain", quarterback: "Quarterback", senior_research_analyst: "Senior Research Analyst" };
  return (
    <BaseEmail title={`You've been promoted to ${TIER_LABELS[newTier] || newTier} — InfinityVolume`} previewText={`Your member tier has been upgraded on InfinityVolume`}>
      <Heading>Tier upgrade 🎉</Heading>
      <Body>Hi {displayName}, congratulations — your membership tier on InfinityVolume has been upgraded.</Body>
      <InfoBox label="Previous tier" value={TIER_LABELS[oldTier] || oldTier} />
      <InfoBox label="New tier" value={TIER_LABELS[newTier] || newTier} />
      <Body>This reflects your contributions and engagement on the platform. Keep up the excellent work.</Body>
      <Button href={`${platformUrl}/member`}>View your profile →</Button>
    </BaseEmail>
  );
}
