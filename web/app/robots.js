// Required for `output: "export"` — without this, Next.js treats this
// route as needing per-request computation and refuses to statically
// export it, even though everything here is actually static at build time.
export const dynamic = "force-static";

const SITE_URL = process.env.SITE_URL || "https://your-domain.example.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
