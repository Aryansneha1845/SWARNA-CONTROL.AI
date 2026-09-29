import Legal from '../legal';

export const metadata = { title: 'Refund Policy — SWARNA-CONTROL.AI' };

export default function Refunds() {
  return (
    <Legal title="Refund Policy" updated="29 September 2026">
      <p><strong>There is nothing to refund.</strong> SWARNA-CONTROL.AI is completely free: no fees,
      no subscriptions, no payments are collected at any point, and no financial transactions pass
      through this site.</p>
      <ul>
        <li>No money is charged → no refunds can arise.</li>
        <li>This tool cannot move, freeze, or recover funds — it only visualises a trail from data you provide.</li>
        <li>If you paid money to a suspected fraudster (outside this site), contact your bank immediately
        (helpline / 1930), file a complaint at cybercrime.gov.in, and report the number on Sanchar
        Saathi Chakshu. Those are the only channels that can act on funds.</li>
      </ul>
      <p>Beware of anyone asking for payment in the name of this project — that would itself be a scam.
      Report it through the channels above.</p>
    </Legal>
  );
}
