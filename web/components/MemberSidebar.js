"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toggleChannelPin } from "../lib/channel-actions";

const NAV_ITEMS = [
  { href: "/member/publish", label: "Publish" },
  { href: "/member/articles", label: "My Articles" },
  { href: "/member/drafts", label: "Saved Drafts" },
  { href: "/member/reports", label: "Report Generator" },
  { href: "/member/bookmarks", label: "Bookmarks" },
  { href: "/member/settings", label: "Settings / Requests" },
];

const PRIVATE_CHANNELS_VISIBLE_CAP = 4;

function PinButton({ channel, onEdited }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleChannelPin(channel.id, !channel.pinned);
      onEdited();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={channel.pinned ? "Unpin" : "Pin to top"}
      className={`ml-1 text-[10px] leading-none disabled:opacity-40 ${
        channel.pinned ? "text-brass-400" : "text-paper/20 hover:text-paper/60"
      }`}
    >
      📌
    </button>
  );
}

function ChannelSubList({ channels, pathname, emptyLabel, capped }) {
  const [expanded, setExpanded] = useState(false);
  const visible = capped && !expanded ? channels.slice(0, PRIVATE_CHANNELS_VISIBLE_CAP) : channels;
  const hiddenCount = channels.length - visible.length;

  function forceRerender() {
    // No local state to refresh here beyond what router.refresh()
    // already re-fetches from the server — this exists purely so
    // PinButton has a consistent onEdited callback shape.
  }

  if (channels.length === 0) {
    return <span className="px-3 py-1.5 text-paper/25 text-xs font-body italic">{emptyLabel}</span>;
  }

  return (
    <>
      {visible.map((channel) => {
        const href = `/member/channels/${channel.id}`;
        const active = pathname === href;
        return (
          <div key={channel.id} className="flex items-center group/channel">
            <Link
              href={href}
              className={`flex-1 min-w-0 px-3 py-1.5 text-sm font-body italic whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
                active ? "text-brass-400" : "text-paper/50 hover:text-paper/80"
              }`}
            >
              {channel.name}
            </Link>
            <PinButton channel={channel} onEdited={forceRerender} />
          </div>
        );
      })}
      {capped && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="px-3 py-1 text-paper/30 text-[11px] font-body hover:text-paper/60 text-left"
        >
          + {hiddenCount} more
        </button>
      )}
      {capped && expanded && channels.length > PRIVATE_CHANNELS_VISIBLE_CAP && (
        <button
          onClick={() => setExpanded(false)}
          className="px-3 py-1 text-paper/30 text-[11px] font-body hover:text-paper/60 text-left"
        >
          Show less
        </button>
      )}
    </>
  );
}

function CollapsibleSection({ title, titleIsLink, titleHref, active, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        {titleIsLink ? (
          <Link
            href={titleHref}
            className={`flex-1 mt-2 px-3 py-2 rounded-md text-sm font-body whitespace-nowrap transition-colors ${
              active ? "bg-ink-800 text-brass-400" : "text-paper/60 hover:bg-ink-800/60 hover:text-paper/90"
            }`}
          >
            {title}
          </Link>
        ) : (
          <span className="flex-1 px-3 pt-2 pb-1 text-paper/40 text-[11px] font-body uppercase tracking-wide">
            {title}
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="px-2 text-paper/30 text-xs hover:text-paper/60"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}

function NavLinks({ pathname, publicChannels, privateChannels, unattendedRequestCount }) {
  return (
    <nav className="w-44 flex flex-col gap-0.5 px-2 py-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const showDot = item.href === "/member/settings" && unattendedRequestCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-body whitespace-nowrap transition-colors flex items-center gap-2 ${
              active ? "bg-ink-800 text-brass-400" : "text-paper/60 hover:bg-ink-800/60 hover:text-paper/90"
            }`}
          >
            {item.label}
            {showDot && (
              <span
                className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"
                title={`${unattendedRequestCount} pending request${unattendedRequestCount === 1 ? "" : "s"}`}
              />
            )}
          </Link>
        );
      })}

      {/* Blank spacer row, per explicit request, separating the
          standard nav items above from the channels section below. */}
      <div className="h-4" aria-hidden="true" />

      {/* Public Channels header is not a link — only super_admin can
          create public channels (enforced at the RLS level), and
          regular members only browse the resulting list. The collapse
          chevron is a new addition — lets a member hide a long list of
          public channels without losing their place, same idea as
          Discord's category collapse. */}
      <CollapsibleSection title="Public Channels" titleIsLink={false}>
        <ChannelSubList channels={publicChannels} pathname={pathname} emptyLabel="None yet" capped={false} />
      </CollapsibleSection>

      {/* Private Channels stays a real link (unlike Public Channels) —
          it leads to the create+browse page, since any member can
          create a private channel. Capped to 4 visible with a "+ N
          more" expander, per explicit request, since this list can
          grow long once a member has several private groups. */}
      <CollapsibleSection
        title="Private Channels"
        titleIsLink={true}
        titleHref="/member/channels/private"
        active={pathname === "/member/channels/private"}
      >
        <ChannelSubList channels={privateChannels} pathname={pathname} emptyLabel="None yet" capped={true} />
      </CollapsibleSection>
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
export default function MemberSidebar({
  permanent = false,
  publicChannels = [],
  privateChannels = [],
  unattendedRequestCount = 0,
}) {
  const pathname = usePathname();

  if (permanent) {
    return (
      <div className="w-44 shrink-0 border-r border-ink-700 bg-ink-900 min-h-screen">
        <NavLinks
          pathname={pathname}
          publicChannels={publicChannels}
          privateChannels={privateChannels}
          unattendedRequestCount={unattendedRequestCount}
        />
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
      <NavLinks
        pathname={pathname}
        publicChannels={publicChannels}
        privateChannels={privateChannels}
        unattendedRequestCount={unattendedRequestCount}
      />
    </div>
  );
}
