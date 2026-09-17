import Link from "next/link";

export const metadata = {
  title: "Cosmos — InfinityVolume",
  description: "Coming soon.",
};

export default function CosmosPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">Infinity</Link>
        <span className="mx-1.5">/</span>
        <span className="text-paper/60">Cosmos</span>
      </nav>
      <h1 className="font-display text-3xl text-paper mb-2">Cosmos</h1>
      <p className="text-paper/40 text-sm font-body">Coming soon.</p>
    </main>
  );
}
