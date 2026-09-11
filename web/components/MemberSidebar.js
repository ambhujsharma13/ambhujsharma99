"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toggleChannelPin } from "../lib/channel-actions";
import UserPanel from "./UserPanel";
import AvatarDisplay from "./AvatarDisplay";

const NAV_ITEMS = [
  {
    href: "/member/publish",
    label: "Publish",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11m0 0l-3.5-3.5M12 15.5l3.5-3.5M4.5 17.5h11" />
      </svg>
    ),
  },
  {
    href: "/member/articles",
    label: "My Articles",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12M4 10h8M4 14h6" />
        <rect x="3" y="3" width="14" height="14" rx="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/member/drafts",
    label: "Saved Drafts",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.032 2.032 0 00-2.87 0L4.5 13.98V16.5h2.52l9.492-9.492a2.032 2.032 0 000-2.521z" />
      </svg>
    ),
  },
  {
    href: "/member/reports",
    label: "Report Generator",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 3.5 5 2.5-3 4 6" />
        <rect x="2" y="2" width="16" height="16" rx="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/member/bookmarks",
    label: "Bookmarks",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10a1 1 0 011 1v13l-6-3.5L4 17V4a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    href: "/member/sentiment",
    label: "Investor Sentiment",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 13l5-5 3 3 4-6 4 4" />
        <circle cx="10" cy="10" r="8" />
      </svg>
    ),
  },
  {
    href: "/member/settings",
    label: "Settings / Requests",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <circle cx="10" cy="10" r="3" />
        <path strokeLinecap="round" d="M10 3v1m0 12v1M3 10h1m12 0h1m-2.05-4.95-.7.7M5.75 14.25l-.7.7m0-9.9.7.7m8.5 8.5.7.7" />
      </svg>
    ),
  },
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

// Permanent 48px icon strip shown on overlay-mode pages (homepage,
// /markets/*). Replaces the old 20px brass ribbon that required hover
// to reveal anything at all. Icons with tooltips are immediately
// readable without hover; the full expanded sidebar still slides out
// on hover for labels and channels. 48px is narrow enough that it
// never compresses the homepage's data tables.
function IconStrip({ pathname, unattendedRequestCount }) {
  return (
    <div className="flex flex-col items-center py-3 gap-1 w-full">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const showDot = item.href === "/member/settings" && unattendedRequestCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              active
                ? "bg-ink-700 text-brass-400"
                : "text-paper/40 hover:bg-ink-800 hover:text-paper/80"
            }`}
          >
            {item.icon}
            {showDot && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </Link>
        );
      })}

      <div className="w-6 h-px bg-ink-700 my-1" />

      {/* Channels icon */}
      <button
        title="Channels"
        className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
          pathname?.startsWith("/member/channels")
            ? "bg-ink-700 text-brass-400"
            : "text-paper/40 hover:bg-ink-800 hover:text-paper/80"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 3V5z" />
        </svg>
      </button>

      {/* Contacts icon */}
      <Link
        href="/member/contacts"
        title="Contacts"
        className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
          pathname === "/member/contacts"
            ? "bg-ink-700 text-brass-400"
            : "text-paper/40 hover:bg-ink-800 hover:text-paper/80"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <circle cx="10" cy="7" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
        </svg>
      </Link>
    </div>
  );
}

function ContactSubList({ contacts, pathname }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? contacts : contacts.slice(0, PRIVATE_CHANNELS_VISIBLE_CAP);
  const hiddenCount = contacts.length - visible.length;

  if (contacts.length === 0) {
    return <span className="px-3 py-1.5 text-paper/25 text-xs font-body">None yet</span>;
  }
  return (
    <>
      {visible.map((contact) => {
        const href = `/member/inbox/${contact.id}`;
        const active = pathname === href;
        return (
          <Link
            key={contact.id}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
              active ? "text-brass-400" : "text-paper/50 hover:text-paper/80"
            }`}
          >
            <AvatarDisplay avatarUrl={contact.avatar_url} displayName={contact.display_name} size={16} />
            <span className="truncate">{contact.display_name || "Member"}</span>
          </Link>
        );
      })}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="px-3 py-1 text-paper/30 text-[11px] font-body hover:text-paper/60 text-left"
        >
          + {hiddenCount} more
        </button>
      )}
    </>
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
    return <span className="px-3 py-1.5 text-paper/25 text-xs font-body">None yet</span>;
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
              className={`flex-1 min-w-0 px-3 py-1.5 text-sm font-body whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
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
  // Collapsed by default — sections open only when the user explicitly
  // clicks the chevron. The title itself still navigates if it's a link
  // (e.g. SA clicking "Public Channels" goes to /member/admin) — the
  // chevron and the title are two independent actions on the same row.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        {titleIsLink ? (
          <Link
            href={titleHref}
            className={`flex-1 min-w-0 px-3 py-2 rounded-md text-sm font-body truncate transition-colors ${
              active ? "bg-ink-800 text-brass-400" : "text-paper/60 hover:bg-ink-800/60 hover:text-paper/90"
            }`}
          >
            {title}
          </Link>
        ) : (
          <span className="flex-1 min-w-0 px-3 py-2 text-paper/60 text-sm font-body truncate">
            {title}
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="px-2 py-2 text-paper/40 text-base hover:text-paper/80 transition-colors shrink-0 leading-none"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "›" : "⌄"}
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}

function NavLinks({ pathname, publicChannels, privateChannels, unattendedRequestCount, contacts, profile }) {
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
            {item.icon}
            <span className="truncate">{item.label}</span>
            {showDot && (
              <span
                className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"
                title={`${unattendedRequestCount} pending request${unattendedRequestCount === 1 ? "" : "s"}`}
              />
            )}
          </Link>
        );
      })}

      {/* Thin divider between nav items and channel/contact sections */}
      <div className="mx-2 my-1 h-px bg-ink-800" />

      {/* Public Channels header is a real link only for super_admins,
          who can create public channels (enforced at the RLS level,
          and now surfaced here too) — regular members still see it as
          non-clickable, since they can only browse the resulting list.
          Confirmed real bug via live testing: this was previously
          non-linked for EVERYONE regardless of role, including
          super_admins — the actual create-channel page (/member/admin)
          exists and is correctly gated, but had no discoverable path
          to it from where a super_admin would naturally look for it.
          The collapse chevron is a separate addition — lets a member
          hide a long list of public channels without losing their
          place, same idea as Discord's category collapse. */}
      <CollapsibleSection
        title="Public Channels"
        titleIsLink={profile?.admin_role === "super_admin"}
        titleHref="/member/admin"
        active={pathname === "/member/admin"}
      >
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

      {/* Contacts — third sidebar section after Private Channels, per
          explicit request, with the same 4-item cap + expander pattern
          already used for Private Channels. "My Contacts" itself stays
          a real link (leads to the full add/manage page), same
          treatment as Private Channels. */}
      <CollapsibleSection title="Contacts / Chats" titleIsLink={true} titleHref="/member/contacts" active={pathname === "/member/contacts"}>
        <ContactSubList contacts={contacts} pathname={pathname} />
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
  profile = null,
  contacts = [],
}) {
  const pathname = usePathname();

  if (permanent) {
    // Sticky + a height that subtracts the header's own height (4rem /
    // 64px, matching the overlay mode's top-16 elsewhere in this file)
    // rather than a plain h-screen — confirmed real bug found via live
    // testing: h-screen alone made this sidebar 100% of the viewport
    // tall, but since it starts below the header in normal page flow
    // (not at the very top), its bottom edge extended past the visible
    // viewport by exactly the header's height, keeping the user panel
    // below the fold regardless of the sticky fix. This calc makes the
    // sidebar fill exactly the remaining space below the header instead.
    return (
      <div className="w-44 shrink-0 border-r border-ink-700 bg-ink-900 h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <NavLinks
            pathname={pathname}
            publicChannels={publicChannels}
            privateChannels={privateChannels}
            unattendedRequestCount={unattendedRequestCount}
            contacts={contacts}
            profile={profile}
          />
        </div>
        <UserPanel profile={profile} />
      </div>
    );
  }

  // Overlay mode: 48px icon strip that expands to full 176px sidebar
  // on hover. Pure CSS — no click, no state, no backdrop needed.
  // The icon strip is always visible (replaces the old 20px brass ribbon).
  // As the container widens on hover, the icon strip fades out and the
  // full labeled sidebar fades in, so there's never a flash of both
  // content layers simultaneously.
  return (
    <div
      className="group fixed left-0 top-16 bottom-0 z-40 w-12 hover:w-44
                 bg-ink-900 border-r border-ink-700 overflow-hidden
                 transition-all duration-200 ease-out hover:shadow-2xl
                 flex flex-col"
    >
      {/* Icon strip — visible in collapsed (w-12) state only.
          Fades out as the group expands on hover. */}
      <div className="absolute inset-0 flex flex-col overflow-hidden
                      opacity-100 group-hover:opacity-0
                      transition-opacity duration-150 pointer-events-auto
                      group-hover:pointer-events-none">
        <div className="flex-1 overflow-y-auto">
          <IconStrip
            pathname={pathname}
            unattendedRequestCount={unattendedRequestCount}
            profile={profile}
          />
        </div>
        <div className="flex justify-center pb-3 pt-1 border-t border-ink-800">
          <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-ink-700">
            <AvatarDisplay avatarUrl={profile?.avatar_url} displayName={profile?.display_name} size={28} />
          </div>
        </div>
      </div>

      {/* Full sidebar — hidden in collapsed state, fades in as group expands. */}
      <div className="flex flex-col h-full
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150 delay-75">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <NavLinks
            pathname={pathname}
            publicChannels={publicChannels}
            privateChannels={privateChannels}
            unattendedRequestCount={unattendedRequestCount}
            contacts={contacts}
            profile={profile}
          />
        </div>
        <UserPanel profile={profile} />
      </div>
    </div>
  );
}
