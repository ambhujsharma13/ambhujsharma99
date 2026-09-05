import Link from "next/link";
import Logo from "../components/Logo";
import LiveStatusIndicator from "../components/LiveStatusIndicator";
import "./globals.css";
import SiteFooter from "../components/SiteFooter";

export const metadata = {
  title: "InfinityVolume — Global Market Volume, Price & Turnover, in USD",
  description:
    "Daily and rolling 3-day price, volume, commodities, and currency dashboard across 15 markets — every figure converted to USD, updating continuously around the clock across time zones.",
};

export default function RootLayout({ children }) {
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
          <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-sm font-body">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
            <div className="flex items-center gap-6">
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
              <LiveStatusIndicator />
            </div>
          </nav>
        </div>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
