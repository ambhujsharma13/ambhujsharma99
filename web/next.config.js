/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export was removed here — confirmed necessary after a real
  // build error: "Middleware cannot be used with output: export".
  // output: "export" was originally chosen so Cloudflare Pages could
  // host the site with zero server needed at request time, with a
  // companion Cloudflare Worker (see /worker) handling any live data
  // client-side. That Worker was never actually deployed (blocked by
  // the long-running Cloudflare Trust & Safety suspension), and the
  // site has been on Vercel — which fully supports server-side Next.js
  // natively — for a long time now. Removing this doesn't affect the
  // existing data pipeline at all (Yahoo Finance → JSON files →
  // committed to the repo → read by the site), since that path never
  // depended on static export in the first place. It's specifically
  // required now for auth: proxy.js (session refresh/route protection),
  // the OAuth callback route handler, and Server Components reading
  // cookies all need an actual server runtime to exist at all.
  images: { unoptimized: true }, // harmless to leave as-is; can revisit once next/image usage is reviewed
};

module.exports = nextConfig;
