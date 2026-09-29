import Legal from '../legal';

export const metadata = { title: 'Cookie Policy — SWARNA-CONTROL.AI' };

export default function Cookies() {
  return (
    <Legal title="Cookie Policy" updated="29 September 2026">
      <h2>Do we need a cookie-consent banner? No.</h2>
      <p>We audited the site on 29 September 2026. Findings:</p>
      <ul>
        <li><strong>No cookies are set</strong> by this application — no session cookies, no preference
        cookies, no analytics cookies.</li>
        <li><strong>No analytics or tracking scripts</strong> (no Google Analytics, Meta Pixel, Hotjar, or equivalents).</li>
        <li><strong>No third-party embeds</strong> — no YouTube iframes, no social widgets, no ad networks.
        Fonts are self-hosted at build time; no runtime font CDN calls.</li>
        <li>Your inputs live only in your browser&apos;s page memory until you press TRACE KARO, and are
        sent to the investigation API solely to answer that request.</li>
      </ul>
      <p>Because there is nothing to consent to, no consent banner is shown — a banner would itself be
      misleading. If tracking is ever introduced, this policy will be updated and a proper consent
      mechanism added <em>before</em> any cookie is set.</p>
      <h2>Managing cookies anyway</h2>
      <p>You can block all cookies in your browser settings; this site will continue to work because it
      does not depend on any.</p>
    </Legal>
  );
}
