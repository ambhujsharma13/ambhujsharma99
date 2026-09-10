import Link from "next/link";
import Logo from "../components/Logo";
import LiveStatusIndicator from "../components/LiveStatusIndicator";
import SearchBox from "../components/SearchBox";
import "./globals.css";
import SiteFooter from "../components/SiteFooter";
import MemberLayoutWrapper from "../components/MemberLayoutWrapper";
import AccountMenu from "../components/AccountMenu";
import { createClient } from "../lib/supabase/server";

export const metadata = {
  title: "InfinityVolume — Global Market Volume, Price & Turnover, in USD",
  description:
    "Daily and rolling 3-day price, volume, commodities, and currency dashboard across 15 markets — every figure converted to USD, updating continuously around the clock across time zones.",
};

export default async function RootLayout({ children }) {
  // Server Component — reads the session directly via the server
  // client, so the nav AND the member sidebar show the correct
  // signed-in/signed-out state on first paint, with no client-side
  // flash between the two states.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public channels are fetched here (Server Component) rather than
  // inside MemberSidebar itself, since MemberSidebar is a Client
  // Component — this keeps the data-fetching pattern consistent with
  // how `user` is already handled on this same page, and avoids adding
  // a client-side fetch/loading-state to what's otherwise a simple,
  // instant-render sidebar.
  const { data: publicChannels } = await supabase
    .from("channels")
    .select("id, name")
    .eq("visibility", "public")
    .order("name", { ascending: true });

  // Private channels — no explicit membership filter needed here
  // either, same as the private channels listing page: RLS already
  // restricts this to channels the current user is a member/admin of,
  // and naturally returns nothing at all for a signed-out visitor
  // (auth.uid() is null in that case).
  const { data: privateChannels } = await supabase
    .from("channels")
    .select("id, name")
    .eq("visibility", "private")
    .order("name", { ascending: true });

  // Sidebar pin preferences — per-user, so fetched only when signed in.
  // Pinned channels are sorted to the front of their respective list,
  // preserving the existing alphabetical order within each group
  // (pinned-then-alphabetical, not pinned-then-whatever-order-came-back).
  let pinnedChannelIds = new Set();
  if (user) {
    const { data: prefs } = await supabase
      .from("channel_sidebar_preferences")
      .select("channel_id")
      .eq("user_id", user.id)
      .eq("pinned", true);
    pinnedChannelIds = new Set((prefs || []).map((p) => p.channel_id));
  }

  function sortPinnedFirst(channels) {
    return [...channels].sort((a, b) => {
      const aPinned = pinnedChannelIds.has(a.id);
      const bPinned = pinnedChannelIds.has(b.id);
      if (aPinned === bPinned) return 0; // preserve existing alphabetical order between two pinned or two unpinned
      return aPinned ? -1 : 1;
    });
  }

  const publicChannelsWithPinFlag = (publicChannels || []).map((c) => ({ ...c, pinned: pinnedChannelIds.has(c.id) }));
  const privateChannelsWithPinFlag = (privateChannels || []).map((c) => ({ ...c, pinned: pinnedChannelIds.has(c.id) }));
  const finalPublicChannels = sortPinnedFirst(publicChannelsWithPinFlag);
  const finalPrivateChannels = sortPinnedFirst(privateChannelsWithPinFlag);

  // Count of pending requests this user hasn't even looked at yet
  // (seen_at is null) — deliberately distinct from a total pending
  // count, matching the "unattended" wording used when this was
  // requested: choosing "Wait" on a request should clear the dot even
  // though the request itself is still pending.
  let unattendedRequestCount = 0;
  if (user) {
    const { count } = await supabase
      .from("pending_requests")
      .select("id", { count: "exact", head: true })
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .is("seen_at", null);
    unattendedRequestCount = count || 0;
  }

  return (
    <html lang="en">
      <head>
        {/* flag-icons: crisp SVG country flags, avoids emoji flags rendering
            as plain letter codes on Windows (see components/FlagIcon.js) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css"
        />
      </head>
      <body className="font-body bg-ink-950 min-h-screen">
        <div className="border-b border-ink-800">
          <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 text-sm font-body">
            <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
              <Logo />
            </Link>
            <SearchBox />
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/" className="text-paper/70 hover:text-brass-400">
                Markets
              </Link>
              <Link href="/commodities" className="text-paper/70 hover:text-brass-400">
                Commodities
              </Link>
              <Link href="/currencies" className="text-paper/70 hover:text-brass-400">
                Currencies
              </Link>
              <Link href="/about" className="text-paper/70 hover:text-brass-400">
                About
              </Link>
              {user ? (
                <AccountMenu />
              ) : (
                <Link href="/sign-in" className="text-brass-400 hover:text-brass-300 font-medium">
                  Sign In
                </Link>
              )}
              <LiveStatusIndicator />
            </div>
          </nav>
        </div>
        {/*
          MemberLayoutWrapper renders for EVERYONE now, signed in or
          not, per explicit request — signed-out visitors should still
          see the sidebar as a hint that more exists behind sign-in,
          not have it disappear entirely. Clicking a link while signed
          out naturally hits proxy.js's existing redirect-to-/sign-in
          logic (it already protects every /member/* route), so no
          separate "disabled" state needs to be built here at all —
          the existing middleware does the right thing automatically.
        */}
        <MemberLayoutWrapper
          publicChannels={finalPublicChannels}
          privateChannels={finalPrivateChannels}
          unattendedRequestCount={unattendedRequestCount}
        >
          {children}
        </MemberLayoutWrapper>
        <SiteFooter />
      </body>
    </html>
  );
}
