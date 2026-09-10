"use client";

import { usePathname } from "next/navigation";
import MemberSidebar from "./MemberSidebar";

export default function MemberLayoutWrapper({ children, publicChannels }) {
  const pathname = usePathname();
  // Homepage AND /markets/* pages both use the same wide DataTable
  // component that caused the original compression bug — any page
  // using that component needs the hover-collapse overlay treatment,
  // not the space-taking permanent sidebar. Pages built with narrower
  // table layouts (Treasury/ETF/Financial Conditions landing pages,
  // member pages) don't share that constraint.
  const needsOverlayMode = pathname === "/" || pathname?.startsWith("/markets/");

  if (needsOverlayMode) {
    // Overlay mode — sidebar floats on top via fixed positioning,
    // children render completely normally, full width, unaffected.
    return (
      <>
        <MemberSidebar permanent={false} publicChannels={publicChannels} />
        {children}
      </>
    );
  }

  // Permanent mode — genuine flex layout, sidebar takes real space,
  // children get the remaining width via flex-1.
  return (
    <div className="flex">
      <MemberSidebar permanent={true} publicChannels={publicChannels} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
