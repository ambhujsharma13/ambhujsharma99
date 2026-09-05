import Link from "next/link";
import Logo from "../../components/Logo";

export const metadata = {
  title: "Terms of Service — InfinityVolume",
  description: "Terms of Service for InfinityVolume, operated by Infinity Group LLC.",
  alternates: { canonical: "/terms" },
};

function H2({ children }) {
  return <h2 className="font-display text-xl text-paper mt-8 mb-3">{children}</h2>;
}
function P({ children }) {
  return <p className="text-paper/60 font-body leading-relaxed mb-4">{children}</p>;
}
function Caps({ children }) {
  return <p className="text-paper/70 font-body text-sm leading-relaxed mb-4 tracking-wide">{children}</p>;
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

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <nav className="text-xs font-body text-paper/40 mb-6">
        <Link href="/" className="hover:text-brass-400">
          InfinityVolume
        </Link>{" "}
        / Terms of Service
      </nav>

      <Logo size={36} />
      <h1 className="font-display text-3xl text-paper mt-6 mb-1">Terms of Service</h1>
      <p className="text-paper/40 text-xs font-mono mb-8">Last updated: September 5, 2026</p>

      <P>
        Please read these Terms of Service (&quot;Terms&quot;) carefully before using InfinityVolume
        (the &quot;Service,&quot; &quot;Site,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a product
        operated by Infinity Group LLC, at infinityvolume.com. By accessing or using the Site, you
        agree to be bound by these Terms. If you do not agree, do not use the Site.
      </P>

      <H2>1. Not Financial, Investment, or Trading Advice</H2>
      <P>
        InfinityVolume provides data, calculations, and commentary for informational purposes
        only. Nothing on this Site constitutes financial, investment, tax, legal, or trading
        advice, or a recommendation to buy, sell, or hold any security, commodity, currency, or
        other instrument.
      </P>
      <P>
        You are solely responsible for any decisions you make based on information found on this
        Site. You should consult a licensed financial advisor before making any investment
        decision. We are not a registered investment advisor, broker-dealer, or financial
        institution of any kind.
      </P>

      <H2>2. No Guarantee of Accuracy, Timeliness, or Completeness</H2>
      <P>
        The data displayed on this Site — including but not limited to prices, volumes, turnover
        ratios, market capitalization, GDP figures, currency exchange rates, bond yields, and any
        calculations derived from them — is aggregated from multiple third-party sources and
        depends on a chain of factors outside our control, including:
      </P>
      <List
        items={[
          "The accuracy and availability of the original data source (including, without limitation, financial data providers, central banks, government agencies, and public data APIs);",
          "Timing differences between when a data source publishes information and when it is retrieved, received, or processed by us;",
          "Delays, interruptions, or errors introduced during our own collection, processing, calculation, or display of that data;",
          "Market conditions, exchange holidays, trading halts, or other events that may cause source data to be delayed, estimated, restated, or unavailable.",
        ]}
      />
      <Caps>
        As a result, we make no representation or warranty, express or implied, that any data on
        this Site is accurate, current, complete, or suitable for any particular purpose at the
        moment you view it. Figures may be delayed, may differ from official exchange or
        regulatory records, and may be corrected or restated without notice. Do not rely on this
        Site as your sole source of information for any financial or trading decision.
      </Caps>

      <H2>3. Third-Party Data Sources</H2>
      <P>
        This Site incorporates data made available by third parties (including, among others,
        financial market data providers, central banks, and government statistical agencies). We
        are not affiliated with, endorsed by, or sponsored by any such third party unless
        explicitly stated. All trademarks, service marks, and company names referenced are the
        property of their respective owners.
      </P>
      <P>
        We do not control and are not responsible for the accuracy, legality, or content of
        third-party data or any changes to how it is provided, including a third party&apos;s
        decision to restrict, discontinue, or alter access to data we rely on.
      </P>

      <H2>4. &quot;As Is&quot; Basis; Disclaimer of Warranties</H2>
      <Caps>
        The Site and all content, data, and functionality are provided &quot;as is&quot; and &quot;as
        available,&quot; without warranties of any kind, whether express or implied, including but
        not limited to implied warranties of merchantability, fitness for a particular purpose,
        non-infringement, accuracy, or uninterrupted availability. We do not warrant that the Site
        will be error-free, secure, or continuously available.
      </Caps>

      <H2>5. Limitation of Liability</H2>
      <Caps>
        To the maximum extent permitted by applicable law, in no event shall InfinityVolume, its
        operators, employees, contractors, or affiliates be liable for any indirect, incidental,
        special, consequential, punitive, or exemplary damages, or any loss of profits, revenue,
        data, or trading losses, arising out of or related to your use of, or inability to use,
        the Site or any data it displays — whether based on warranty, contract, tort (including
        negligence), or any other legal theory, even if we have been advised of the possibility of
        such damages.
      </Caps>
      <Caps>
        To the extent any liability cannot be excluded under applicable law, our total aggregate
        liability to you for all claims arising from your use of the Site shall not exceed $100
        USD.
      </Caps>

      <H2>6. Indemnification</H2>
      <P>
        You agree to indemnify and hold harmless InfinityVolume and its operators from any claims,
        damages, losses, liabilities, and expenses (including reasonable legal fees) arising from
        your use of the Site, your violation of these Terms, or your violation of any rights of a
        third party.
      </P>

      <H2>7. Acceptable Use</H2>
      <P>You agree not to:</P>
      <List
        items={[
          "Scrape, harvest, or systematically extract data from the Site using automated means beyond normal, reasonable personal use, without our prior written consent;",
          "Resell, redistribute, or sublicense data obtained from the Site as a standalone commercial data product;",
          "Attempt to interfere with, disrupt, or gain unauthorized access to the Site, its infrastructure, or its underlying data pipelines;",
          "Use the Site for any unlawful purpose or in violation of any applicable law or regulation.",
        ]}
      />

      <H2>8. Intellectual Property</H2>
      <P>
        The Site&apos;s design, layout, original written content (including any commentary,
        articles, or analysis published by our team), and branding are our property or the
        property of our licensors, and may not be copied, reproduced, or distributed without
        permission. This does not extend to underlying factual data sourced from third parties,
        which remains subject to those parties&apos; own terms.
      </P>

      <H2>9. User Accounts</H2>
      <P>
        If you register for an account, you are responsible for maintaining the confidentiality of
        your login credentials and for all activity under your account. You agree to provide
        accurate information during registration and to notify us promptly of any unauthorized use
        of your account. We reserve the right to suspend or terminate accounts that violate these
        Terms.
      </P>
      <P>
        If we introduce subscriptions, paid features, or other account-specific functionality in
        the future, additional terms specific to those features will apply and will be presented
        to you at that time.
      </P>

      <H2>10. Changes to the Service and These Terms</H2>
      <P>
        We may modify, suspend, or discontinue any part of the Site at any time without notice. We
        may update these Terms from time to time; continued use of the Site after changes are
        posted constitutes acceptance of the revised Terms. We will update the &quot;Last
        updated&quot; date above when changes are made.
      </P>

      <H2>11. Termination</H2>
      <P>
        We reserve the right to restrict or terminate your access to the Site, at our sole
        discretion, without notice, for conduct that we believe violates these Terms or is harmful
        to other users, us, or third parties.
      </P>

      <H2>12. Governing Law</H2>
      <P>
        These Terms are governed by the laws of the State of New Hampshire, United States, without
        regard to its conflict of law principles.
      </P>

      <H2>13. Contact</H2>
      <P>
        Questions about these Terms can be sent to{" "}
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
