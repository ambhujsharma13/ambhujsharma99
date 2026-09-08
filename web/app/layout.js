import Link from "next/link";
import Logo from "../components/Logo";
import LiveStatusIndicator from "../components/LiveStatusIndicator";
import SearchBox from "../components/SearchBox";
import "./globals.css";
import SiteFooter from "../components/SiteFooter";
import MemberSidebar from "../components/MemberSidebar";
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
                <Link href="/member/publish" className="text-brass-400 hover:text-brass-300 font-medium">
                  My Account
                </Link>
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
          Member sidebar is a SEPARATE element from the homepage's own
          existing left column (Discussions + Countries) — it sits at
          the far-left edge of the whole site, persistent across every
          page, not just the homepage. Only rendered when signed in;
          signed-out visitors see the exact same layout as before this
          feature existed.
        */}
        <div className="flex">
          {user && <MemberSidebar />}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
