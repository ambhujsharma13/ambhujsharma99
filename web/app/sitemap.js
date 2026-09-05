import { MARKETS } from "../lib/markets";

// Next.js auto-serves this as /sitemap.xml. Update SITE_URL to your real
// domain once you have one (or your default Vercel URL) — search engines
// need absolute URLs here, not relative paths.
const SITE_URL = process.env.SITE_URL || "https://your-domain.example.com";

export default function sitemap() {
  // US now lives at "/" (the new default landing page), so it's excluded
  // here to avoid listing the same content under two URLs.
  const marketRoutes = MARKETS.filter((m) => !m.unavailable && m.key !== "US").map((m) => ({
    url: `${SITE_URL}/markets/${m.key}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Individual ticker detail pages (/markets/X/TICKER) aren't enumerated
  // here — there are ~650 of them, and they're all reachable via internal
  // links from each market's table, which search engines follow just
  // fine. Worth revisiting once those pages have real content beyond the
  // current placeholder note.
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/commodities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/currencies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...marketRoutes,
  ];
}
