import Link from "next/link";
import Logo from "../../components/Logo";

export const metadata = {
  title: "Privacy Policy — InfinityVolume",
  description: "Privacy Policy for InfinityVolume, operated by Infinity Group LLC. We never sell, rent, trade, or disclose your personal data.",
  alternates: { canonical: "/privacy" },
};

function H2({ children }) {
  return <h2 className="font-display text-xl text-paper mt-8 mb-3">{children}</h2>;
}
function P({ children }) {
  return <p className="text-paper/60 font-body leading-relaxed mb-4">{children}</p>;
}
function List({ items }) {
  return (
    <ul className="list-disc list-inside text-paper/60 font-body leading-relaxed mb-4 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Privacy Policy
      </nav>

      <Logo size={36} />
      <h1 className="font-display text-3xl text-paper mt-6 mb-1">Privacy Policy</h1>
      <p className="text-paper/40 text-xs font-mono mb-6">Last updated: September 5, 2026</p>

      <div className="border border-brass-500/30 bg-brass-500/5 rounded-lg p-4 mb-8">
        <p className="text-brass-400 font-body text-sm leading-relaxed">
          The short version: we do not sell, rent, trade, or disclose your personal data to third
          parties, ever. The rest of this policy explains what data we do handle and why.
        </p>
      </div>

      <P>
        This Privacy Policy explains how Infinity Group LLC (&quot;we,&quot; &quot;us,&quot;
        &quot;our&quot;), operator of InfinityVolume at infinityvolume.com (the &quot;Site&quot;),
        handles information in connection with your use of the Site.
      </P>

      <H2>1. Information We Collect</H2>
      <P>We collect information depending on how you interact with the Site:</P>
      <List
        items={[
          "Account registration — if you create an account, we collect the information needed to do so, such as your name and email address.",
          "Email newsletter — if you subscribe to our newsletter, we collect your email address (and name, if provided) to send it to you.",
          "Contact information you provide voluntarily — for example, if you email admin@infinityvolume.com, we receive whatever information you choose to include in that message.",
          "Basic technical/analytics data — such as pages visited, approximate location (derived from IP address), browser/device type, and referring site, collected automatically through standard web analytics tools. This is used in aggregate to understand how the Site is used and is not used to build individual profiles of you.",
          "Cookies — the Site may use minimal cookies necessary for basic functionality, such as keeping you signed in or remembering a display preference. We do not use cookies for cross-site advertising tracking.",
        ]}
      />
      <P>
        If we introduce additional features in the future that require collecting more information
        (such as payment details for a paid subscription), this policy will be updated before that
        feature launches, and you will be told at that point exactly what is collected and why.
      </P>

      <H2>2. How We Use Information</H2>
      <P>Any information we collect is used only to:</P>
      <List
        items={[
          "Operate, maintain, and improve the Site;",
          "Respond to inquiries sent to us directly (e.g., via admin@infinityvolume.com);",
          "Understand aggregate usage patterns to make the Site more useful.",
        ]}
      />
      <P>
        We do not use your information for targeted advertising, and we do not build behavioral
        profiles for sale or third-party marketing purposes.
      </P>

      <H2>3. What We Do Not Do</H2>
      <List
        items={[
          "We do not sell your personal data.",
          "We do not rent your personal data.",
          "We do not trade your personal data.",
          "We do not disclose your personal data to third parties, except: (a) where required by law (e.g., a valid legal request from a government authority), or (b) to service providers who process data strictly on our behalf and under our instructions (for example, an email hosting provider or analytics tool), and who are not permitted to use it for their own purposes.",
        ]}
      />

      <H2>4. Third-Party Services</H2>
      <P>
        The Site displays data sourced from third-party providers (financial data providers,
        central banks, government statistical agencies, etc.) as described in our{" "}
        <Link href="/terms" className="text-brass-400 hover:underline">
          Terms of Service
        </Link>
        . Viewing this data does not involve sharing any of your personal information with those
        sources — it is a one-way flow of public market/economic data into the Site, not a
        transfer of your data out.
      </P>
      <P>
        If the Site is hosted or delivered in part through third-party infrastructure providers
        (such as hosting, content delivery, or analytics services), those providers may process
        limited technical data (like IP address) as part of standard web delivery — this is normal
        for any website and is not additional data collection by us beyond what&apos;s described
        above.
      </P>

      <H2>5. Data Security</H2>
      <P>
        We take reasonable steps to protect any information sent to us, but no method of
        transmission or storage over the internet is 100% secure. We cannot guarantee absolute
        security.
      </P>

      <H2>6. Data Retention</H2>
      <P>
        We retain information only as long as necessary for the purposes described in this policy
        — for example, email correspondence is kept only as long as reasonably needed to address
        your inquiry and for our own recordkeeping.
      </P>

      <H2>7. Your Rights</H2>
      <P>
        Depending on where you live, you may have rights regarding your personal data, such as the
        right to request access to, correction of, or deletion of information we hold about you.
        Contact us at{" "}
        <a href="mailto:admin@infinityvolume.com" className="text-brass-400 hover:underline">
          admin@infinityvolume.com
        </a>{" "}
        and we will respond.
      </P>

      <H2>8. Children&apos;s Privacy</H2>
      <P>
        The Site is not directed at children under 13 (or the relevant minimum age in your
        jurisdiction), and we do not knowingly collect personal information from children.
      </P>

      <H2>9. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time, particularly as the Site adds new
        features. We will update the &quot;Last updated&quot; date above when changes are made.
        Material changes affecting how we handle your data will be communicated clearly, not
        buried in a silent update.
      </P>

      <H2>10. Contact</H2>
      <P>
        Questions about this Privacy Policy or how we handle information can be sent to{" "}
        <a href="mailto:admin@infinityvolume.com" className="text-brass-400 hover:underline">
          admin@infinityvolume.com
        </a>
        .
      </P>

      <div className="mt-8">
        <Link href="/" className="text-brass-400 text-sm font-body hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
