import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const disp = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-disp' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' });

export const metadata = {
  title: 'SWARNA-CONTROL.AI — Financial Investigation Command Center',
  description: 'Cross-rail financial intelligence: UPI, bank, identity and crypto tracing with evidence-backed investigation. No tips, evidence only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${disp.variable} ${mono.variable}`}>
      <body style={{ fontFamily: 'var(--font-disp), Space Grotesk, system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
