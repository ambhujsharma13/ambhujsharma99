import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 mt-8">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <Logo size={22} />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-body text-paper/50">
            <Link href="/about" className="hover:text-brass-400">
              About
            </Link>
            <Link href="/terms" className="hover:text-brass-400">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-brass-400">
              Privacy Policy
            </Link>
            <a href="mailto:admin@infinityvolume.com" className="hover:text-brass-400">
              admin@infinityvolume.com
            </a>
          </nav>
        </div>
        <p className="text-paper/30 text-xs font-body leading-relaxed">
          InfinityVolume provides market data for informational purposes only
          and is not financial or investment advice. Data is sourced from
          third parties and may be delayed, incomplete, or subject to
          correction — see our{" "}
          <Link href="/terms" className="underline hover:text-paper/50">
            Terms of Service
          </Link>{" "}
          for details. We never sell, rent, or disclose your personal data —
          see our{" "}
          <Link href="/privacy" className="underline hover:text-paper/50">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-paper/20 text-[11px] font-body mt-3">
          © {new Date().getFullYear()} InfinityVolume. Prices via Yahoo
          Finance, FX via ECB reference rates (Frankfurter API), GDP via the
          World Bank Open Data API, Treasury yields via FRED.
        </p>
      </div>
    </footer>
  );
}
