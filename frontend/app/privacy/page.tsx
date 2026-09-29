import Legal from '../legal';

export const metadata = { title: 'Privacy Policy — SWARNA-CONTROL.AI' };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="29 September 2026">
      <p><strong>What this product is.</strong> SWARNA-CONTROL.AI is a free, non-commercial student
      prototype built for the SANGYAN Hackathon 2026. It reconstructs a suspicious payment trail
      from information <em>you</em> paste in. It is not a bank, broker, advisor, or government service.</p>
      <h2>1. Data we collect — and why (DPDP Act purpose limitation)</h2>
      <ul>
        <li><strong>Message text you paste</strong> (e.g. a suspicious WhatsApp/Telegram message) — used only to extract identifiers such as UPI IDs and phone numbers for the investigation you requested.</li>
        <li><strong>UPI details you paste</strong> (VPA, amount, reference) — used only to match the payment to the message.</li>
        <li><strong>Crypto transaction hash you paste</strong> — used only to look up public on-chain data.</li>
      </ul>
      <p>We do <strong>not</strong> ask for, and you must <strong>never</strong> enter: OTPs, passwords, PINs,
      bank logins, Aadhaar numbers, or full account numbers. The tool refuses nothing automatically —
      so please keep them out yourself.</p>
      <h2>2. Data we do NOT collect</h2>
      <ul>
        <li>No accounts, no names, no email addresses, no phone numbers of our own.</li>
        <li>No analytics, no tracking pixels, no advertising identifiers.</li>
        <li>No cookies except strictly functional ones (see Cookie Policy — currently none).</li>
      </ul>
      <h2>3. Storage &amp; retention</h2>
      <p>Investigations run in memory and are <strong>not stored</strong> on our servers. Server logs
      (if enabled by the host) may contain IP addresses for security purposes and are retained for
      a maximum of 30 days. Demo fixtures in the public code repository are synthetic and contain
      no real personal data.</p>
      <h2>4. Sharing</h2>
      <p>To answer your request, the server queries public third-party APIs (Etherscan for on-chain
      data; an AI provider for message parsing). Only the text you submit is sent, and only for that
      lookup. We do not sell or share data for marketing — there is no marketing.</p>
      <h2>5. Your rights (India&apos;s DPDP Act, 2023)</h2>
      <p>You may request access, correction, or deletion of any data you submitted by contacting us
      via the SANGYAN Unstop listing. Since nothing is retained after your session, deletion is
      normally already complete the moment you close the page.</p>
      <h2>6. Children</h2>
      <p>This prototype is intended for demonstration to the hackathon jury and is not directed at children.</p>
      <h2>7. Changes</h2>
      <p>If this prototype ever becomes a hosted service, this policy will be updated before any
      additional data collection begins.</p>
    </Legal>
  );
}
