"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// One addition beyond what was explicitly listed: "My Articles" —
// distinct from "Saved Drafts" (in-progress work) and "Bookmarks"
// (other members' content saved for later) — this is the user's own
// PUBLISHED work specifically. Flagging this as an addition, not
// something explicitly requested, since it seemed like a natural gap
// once drafts and bookmarks were both separately called out.
const NAV_ITEMS = [
  { href: "/member/publish", label: "Publish" },
  { href: "/member/articles", label: "My Articles" },
  { href: "/member/drafts", label: "Saved Drafts" },
  { href: "/member/watchlists", label: "Watchlists" },
  { href: "/member/bookmarks", label: "Bookmarks" },
  { href: "/member/settings", label: "Settings" },
];

export default function MemberSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-44 shrink-0 border-r border-ink-800 min-h-screen py-4">
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-body transition-colors ${
                active ? "bg-ink-800 text-brass-400" : "text-paper/60 hover:bg-ink-800/60 hover:text-paper/90"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
