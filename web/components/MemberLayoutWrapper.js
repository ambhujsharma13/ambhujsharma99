"use client";

import { usePathname } from "next/navigation";
import MemberSidebar from "./MemberSidebar";

export default function MemberLayoutWrapper({
  children,
  publicChannels,
  privateChannels,
  unattendedRequestCount = 0,
  pendingReviewCount = 0,
  pendingChangesCount = 0,
  humanIntelUnreadCount = 0,
  profile = null,
  contacts = [],
}) {
  const pathname = usePathname();
  const needsOverlayMode = pathname === "/" || pathname?.startsWith("/markets/");

  if (needsOverlayMode) {
    return (
      <>
        <MemberSidebar
          permanent={false}
          publicChannels={publicChannels}
          privateChannels={privateChannels}
          unattendedRequestCount={unattendedRequestCount}
          pendingReviewCount={pendingReviewCount}
          pendingChangesCount={pendingChangesCount}
          humanIntelUnreadCount={humanIntelUnreadCount}
          profile={profile}
          contacts={contacts}
        />
        {children}
      </>
    );
  }

  return (
    <div className="flex">
      <MemberSidebar
        permanent={true}
        publicChannels={publicChannels}
        privateChannels={privateChannels}
        unattendedRequestCount={unattendedRequestCount}
        pendingReviewCount={pendingReviewCount}
        pendingChangesCount={pendingChangesCount}
          humanIntelUnreadCount={humanIntelUnreadCount}
        profile={profile}
        contacts={contacts}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
