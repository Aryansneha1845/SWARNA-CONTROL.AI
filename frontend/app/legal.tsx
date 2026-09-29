/* Shared shell for legal pages: readable, keyboard-navigable, honest. */
import Link from 'next/link';

export default function Legal({ title, updated, children }: {
  title: string; updated: string; children: React.ReactNode;
}) {
  return (
    <main style={{ background: '#0b0f14', color: '#e5e7eb', minHeight: '100vh', padding: '32px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <nav aria-label="Legal pages" style={{ marginBottom: 20, fontSize: 13 }}>
          <Link href="/" style={{ color: '#f59e0b' }}>← Back to SWARNA-CONTROL.AI</Link>
          {' · '}
          <Link href="/privacy" style={{ color: '#93a1b5' }}>Privacy</Link>{' · '}
          <Link href="/terms" style={{ color: '#93a1b5' }}>Terms</Link>{' · '}
          <Link href="/cookies" style={{ color: '#93a1b5' }}>Cookies</Link>{' · '}
          <Link href="/refunds" style={{ color: '#93a1b5' }}>Refunds</Link>
        </nav>
        <h1 style={{ fontSize: 28, margin: '0 0 4px' }}>{title}</h1>
        <p style={{ color: '#93a1b5', fontSize: 13 }}>Last updated: {updated}</p>
        <div style={{ lineHeight: 1.7, fontSize: 14 }}>{children}</div>
        <footer style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #1f2937', fontSize: 12, color: '#93a1b5' }}>
          SWARNA-CONTROL.AI — student prototype built for SANGYAN Hackathon 2026
          (SNTC, IIT (BHU) Varanasi · in collaboration with SEBI &amp; NSDL).
          Not a commercial product. Contact: via the SANGYAN Unstop listing.
        </footer>
      </div>
    </main>
  );
}
