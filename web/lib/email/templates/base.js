import * as React from "react";

const BRAND = "#C9A84C"; // brass-400
const BG = "#0a0a0a";
const SURFACE = "#111111";
const TEXT = "#e8e6e0";
const TEXT_MUTED = "#6b6b6b";

export function BaseEmail({ title, previewText, children }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {previewText && <meta name="x-preview-text" content={previewText} />}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: BG, fontFamily: "'Inter', Arial, sans-serif" }}>
        {/* Invisible preview text */}
        {previewText && (
          <div style={{ display: "none", maxHeight: 0, overflow: "hidden", color: BG }}>
            {previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
          </div>
        )}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: BG }}>
          <tr>
            <td align="center" style={{ padding: "40px 20px" }}>
              <table width="560" cellPadding="0" cellSpacing="0" style={{ maxWidth: 560 }}>
                {/* Header */}
                <tr>
                  <td style={{ paddingBottom: 32, textAlign: "center" }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 20, color: BRAND, letterSpacing: "0.05em" }}>
                      InfinityVolume
                    </span>
                  </td>
                </tr>
                {/* Card */}
                <tr>
                  <td style={{ backgroundColor: SURFACE, borderRadius: 12, padding: "32px 36px", border: "1px solid #222" }}>
                    {children}
                  </td>
                </tr>
                {/* Footer */}
                <tr>
                  <td style={{ paddingTop: 24, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.6 }}>
                      InfinityVolume · Global Market Intelligence<br />
                      <a href="https://www.infinityvolume.com" style={{ color: TEXT_MUTED }}>infinityvolume.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

export function Heading({ children }) {
  return <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600, color: "#e8e6e0", lineHeight: 1.3 }}>{children}</h1>;
}

export function Body({ children }) {
  return <p style={{ margin: "0 0 20px", fontSize: 15, color: "#a0a0a0", lineHeight: 1.7 }}>{children}</p>;
}

export function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid #222", margin: "24px 0" }} />;
}

export function Button({ href, children }) {
  return (
    <table cellPadding="0" cellSpacing="0" style={{ margin: "24px 0 0" }}>
      <tr>
        <td style={{ backgroundColor: BRAND, borderRadius: 8, textAlign: "center" }}>
          <a href={href} style={{ display: "inline-block", padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#000", textDecoration: "none" }}>
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

export function InfoBox({ label, value }) {
  return (
    <table cellPadding="0" cellSpacing="0" width="100%" style={{ margin: "16px 0", backgroundColor: "#0f0f0f", borderRadius: 8, border: "1px solid #1f1f1f" }}>
      <tr>
        <td style={{ padding: "12px 16px" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>{label}</span><br />
          <span style={{ fontSize: 15, color: "#e8e6e0", fontWeight: 500 }}>{value}</span>
        </td>
      </tr>
    </table>
  );
}

export const BRAND_COLOR = BRAND;
export const TEXT_COLOR = TEXT;
export const MUTED_COLOR = TEXT_MUTED;
