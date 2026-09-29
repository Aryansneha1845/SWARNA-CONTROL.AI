import Legal from '../legal';

export const metadata = { title: 'Terms & Conditions — SWARNA-CONTROL.AI' };

export default function Terms() {
  return (
    <Legal title="Terms & Conditions" updated="29 September 2026">
      <h2>1. What this is</h2>
      <p>SWARNA-CONTROL.AI is a free hackathon prototype that visualises a payment trail from data
      you provide. It offers <strong>no investment advice, no scam verdicts, and no recovery guarantees</strong>.
      Outputs are investigation aids (Known fact / Supported / Possible / Unverified), not accusations
      and not legal findings.</p>
      <h2>2. Acceptable use</h2>
      <ul>
        <li>Submit only data you own or have the right to analyse (your own messages and payments).</li>
        <li>Do not submit OTPs, passwords, or anyone else&apos;s private financial data.</li>
        <li>Do not use outputs to harass, defame, or accuse any person or business.</li>
        <li>Do not attempt to probe, overload, or bypass the service&apos;s rate limits and access controls.</li>
      </ul>
      <h2>3. No warranties</h2>
      <p>Provided &quot;as is&quot; for demonstration. Blockchain data comes from public explorers;
      AI-extracted identifiers can be wrong — every link shows its evidence and confidence so you can
      verify before acting. For real fraud, always report via official channels: cybercrime.gov.in,
      Sanchar Saathi Chakshu, your bank&apos;s helpline / 1930, and SEBI SCORES where applicable.</p>
      <h2>4. Intellectual property</h2>
      <p>Per the SANGYAN hackathon terms, IP in submissions vests as stated in the official hackathon
      Terms &amp; Conditions. Sample messages in the demo are synthetic illustrations, not real cases.</p>
      <h2>5. Liability</h2>
      <p>To the maximum extent permitted by law, the student developers accept no liability for actions
      taken on the basis of prototype outputs.</p>
      <h2>6. Governing law</h2>
      <p>These terms are governed by the laws of India. Disputes are subject to the jurisdiction noted
      in the hackathon&apos;s official terms.</p>
    </Legal>
  );
}
