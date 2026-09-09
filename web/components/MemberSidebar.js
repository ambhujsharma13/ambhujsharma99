"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/member/publish", label: "Publish" },
  { href: "/member/articles", label: "My Articles" },
  { href: "/member/drafts", label: "Saved Drafts" },
  { href: "/member/watchlists", label: "Watchlists" },
  { href: "/member/bookmarks", label: "Bookmarks" },
  { href: "/member/settings", label: "Settings" },
];

function NavLinks({ pathname }) {
  return (
    <nav className="w-44 flex flex-col gap-0.5 px-2 py-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-body whitespace-nowrap transition-colors ${
              active ? "bg-ink-800 text-brass-400" : "text-paper/60 hover:bg-ink-800/60 hover:text-paper/90"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// permanent=true renders an always-expanded sidebar that takes real
// layout space (a genuine flex sibling, not an overlay) — used
// everywhere except the homepage, per explicit request: only the
// homepage has the dense 3-column layout that the hover-collapse
// overlay was originally built to avoid compressing. Other pages don't
// have that same constraint, so there's no reason to hide the sidebar
// by default there.
export default function MemberSidebar({ permanent = false }) {
  const pathname = usePathname();

  if (permanent) {
    return (
      <div className="w-44 shrink-0 border-r border-ink-700 bg-ink-900 min-h-screen">
        <NavLinks pathname={pathname} />
      </div>
    );
  }

  // Hover-collapse overlay — fixed positioning so it never participates
  // in the homepage's own layout calculation (the original fix for the
  // equity-table compression bug). Collapsed to a slim 20px strip with
  // a brass ribbon indicator, expanding to the full 176px on hover.
  return (
    <div
      className="group fixed left-0 top-16 bottom-0 z-40 w-5 hover:w-44
                 bg-ink-900 border-r border-ink-700 overflow-hidden
                 transition-all duration-200 ease-out hover:shadow-2xl"
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-r-md
                   bg-brass-400 group-hover:opacity-0 transition-opacity duration-150"
        aria-hidden="true"
      />
      <NavLinks pathname={pathname} />
    </div>
  );
}
