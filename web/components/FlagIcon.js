/**
 * Renders a crisp SVG flag via the "flag-icons" library (loaded from a CDN
 * in layout.js) instead of emoji flags. This matters more than it sounds —
 * emoji flags render as plain two-letter text on Windows in most browsers
 * (Windows doesn't ship the flag glyphs its font uses elsewhere), so what
 * looked fine to me while building this may well have shown up as "US"
 * "CN" etc. instead of actual flags on your machine.
 */
export default function FlagIcon({ iso2, className = "" }) {
  if (!iso2) return null;
  return (
    <span
      className={`fi fi-${iso2} inline-block rounded-sm ${className}`}
      style={{ width: "1.3em", height: "1em", verticalAlign: "middle" }}
      aria-hidden="true"
    />
  );
}
