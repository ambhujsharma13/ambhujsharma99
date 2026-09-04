/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: the whole site becomes plain HTML/JS/CSS in the `out`
  // folder, with zero Next.js server needed at request time. This is what
  // lets Cloudflare Pages host it directly with no adapter — the live
  // price/FX/commodity data is served separately by its own Cloudflare
  // Worker (see /worker), fetched client-side, so the site itself never
  // needs server-side rendering per request.
  output: "export",
  images: { unoptimized: true }, // Next's image optimizer needs a server; not used here anyway
};

module.exports = nextConfig;
