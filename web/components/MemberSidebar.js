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

export default function MemberSidebar() {
  const pathname = usePathname();

  return (
    // Fixed positioning, not a flex sibling — this is the actual fix
    // for the reported bug: the old version sat inside a flex row
    // alongside the main content, so its 176px width permanently ate
    // into the space available to the homepage's own 3-column layout,
    // compressing the equity table until its text and sparklines
    // overflowed into the next column. A fixed-position overlay never
    // participates in that layout calculation at all — the main
    // content is always full width, and this simply floats on top of
    // it only while the mouse is actually over it.
    //
    // Collapsed width increased from 12px to 20px (still slim, less
    // easy to miss), with a small brass "ribbon" tab at the vertical
    // middle to make it visually obvious there's something hoverable
    // there — a plain thin strip alone wasn't a strong enough visual
    // cue. The ribbon fades out once the panel is actually expanded,
    // since the visible nav items make the hover state self-evident at
    // that point.
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
    </div>
  );
}
