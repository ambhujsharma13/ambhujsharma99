"use client";

import { useState } from "react";

// Logo.dev's ticker endpoint is US/major-exchange oriented — it likely
// won't recognize exchange-suffixed international symbols like "SAP.DE"
// or "005930.KS" directly, so this strips common suffixes as a best
// effort. Coverage for non-US tickers may still be incomplete; the
// monogram fallback below means that never shows as a broken image,
// just a plain colored initial instead of a real logo.
function bareSymbol(symbol) {
  return symbol.split(".")[0].split("=")[0].replace("-USD", "");
}

// Deterministic color from the ticker string, so the same company always
// gets the same fallback color rather than a random one on every render.
function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

export default function CompanyLogo({ symbol, name, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

  if (!token || failed) {
    const initial = (name || symbol || "?").trim()[0]?.toUpperCase() || "?";
    return (
      <span
        className="inline-flex items-center justify-center rounded-full text-paper font-mono shrink-0"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.45,
          backgroundColor: colorFromString(symbol || name || "x"),
        }}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  const src = `https://img.logo.dev/ticker/${bareSymbol(symbol)}?token=${token}&size=${size * 2}&format=png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded-full shrink-0 object-cover"
      onError={() => setFailed(true)}
    />
  );
}
