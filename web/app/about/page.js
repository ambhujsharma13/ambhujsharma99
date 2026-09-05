import Link from "next/link";
import Logo from "../../components/Logo";

export const metadata = {
  title: "About InfinityVolume",
  description: "About InfinityVolume — global market volume, price, and turnover data, always on.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / About
      </nav>

      <div className="mb-8">
        <Logo size={40} />
      </div>

      {/* TODO: replace every section below with your real content. Left as
          clearly-labeled placeholders rather than guessed copy, since this
          is exactly the kind of thing that should be in your own voice. */}

      <section className="mb-8">
        <h2 className="font-display text-xl text-paper mb-2">Who we are</h2>
        <p className="text-paper/50 font-body leading-relaxed">
          [Placeholder — a paragraph about you/your organization: who's
          behind InfinityVolume, your background, and why you built this.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-paper mb-2">What InfinityVolume does</h2>
        <p className="text-paper/50 font-body leading-relaxed">
          [Placeholder — the mission/pitch: daily and rolling volume,
          price, and turnover data across 15 global markets, commodities,
          and currencies, all normalized to USD, updated automatically.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-paper mb-2">Data sources & methodology</h2>
        <p className="text-paper/50 font-body leading-relaxed">
          [Placeholder — link out to or summarize the methodology notes
          already in the project README: Yahoo Finance for prices, the
          World Bank for GDP, ECB reference rates for FX, and the
          turnover-ratio calculation you designed.]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-paper mb-2">Contact</h2>
        <p className="text-paper/50 font-body leading-relaxed">
          [Placeholder — an email address, social links, or a contact form.]
        </p>
      </section>

      <div className="mt-6">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
