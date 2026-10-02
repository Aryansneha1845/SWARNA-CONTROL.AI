'use client';
/* First-run guide: "What does it do?" + 60-second tour.
   Same flat modal pattern as palette/intake (palette-back + palette).
   Evidence-only language: no tips, no verdicts, no percentages. */
import { useEffect } from 'react';

export interface TourStep {
  title: string;
  body: string;
  cta?: string;
}

export const WHAT_IT_DOES: { icon: string; title: string; body: string }[] = [
  {
    icon: '❶',
    title: 'Paste — 3 cheezein',
    body: 'Suspicious message + UPI payment details + crypto hash (optional). Apna data hi daalo — OTP/password kabhi nahi. Confused? Synthetic demo buttons dabao: Praveen ya Kavita.',
  },
  {
    icon: '❷',
    title: 'Trace — ek timeline',
    body: 'AI message se naam/UPI/phone nikaalta hai, UPI parse hota hai, ETH trail follow hota hai. Sab jud ke ek graph banta hai — har link pe Evidence Card: Known fact, Supported, Possible ya Unverified.',
  },
  {
    icon: '❸',
    title: 'Control — wapas tumhare haath',
    body: 'Kill Chain dikhta hai (lure se cash-out tak), Hindi me next action suno, Chakshu/SCORES draft + family alert ready. Hum verdict nahi dete — control wapas dete hain.',
  },
];

export const TOUR_STEPS: TourStep[] = [
  {
    title: '1/5 · Ye room kya hai?',
    body: 'Cross-rail investigation control room: message + UPI + crypto — teen tukde ek trail me. Neeche 3 cards me poora flow hai. Ye tour 60 second ka hai, Skip kabhi bhi.',
  },
  {
    title: '2/5 · Investigation shuru karo',
    body: '＋ NEW INVESTIGATION dabao → message, UPI details, hash paste karo → consent tick → TRACE KARO. Pehli baar? "Synthetic demo: Praveen" button se shuru karo — kuch type karne ki zaroorat nahi.',
    cta: 'open-intake',
  },
  {
    title: '3/5 · Graph padho',
    body: 'Bade canvas me MESSAGE → UPI → ON-RAMP → wallets dikhenge. Upar rail filter (UPI / CRYPTO / ALL), neeche timeline — play dabao aur paisa aage badhta dekho. Space = play/pause, R = replay.',
  },
  {
    title: '4/5 · Evidence kholo',
    body: 'Kisi bhi edge/node pe click → right panel me EVIDENCE vault. Har card batata hai ye link Known fact hai ya Supported/Possible/Unverified — aur kyun. Bina evidence, koi daava nahi.',
  },
  {
    title: '5/5 · Control le lo',
    body: 'Right panel → CONTROL tab: Kill Chain + Hindi summary (suno bhi) + Chakshu/SCORES draft + family alert. Export se poora case JSON download. Bas — ab khud ek trace chalao!',
    cta: 'open-intake',
  },
];

export default function Tutorial({ open, step, setStep, onClose, onOpenIntake }: {
  open: boolean;
  step: number;
  setStep: (n: number) => void;
  onClose: () => void;
  onOpenIntake: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((step + 1) % TOUR_STEPS.length);
      if (e.key === 'ArrowLeft') setStep((step + TOUR_STEPS.length - 1) % TOUR_STEPS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, setStep, onClose]);

  if (!open) return null;
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  return (
    <div className="palette-back" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()} role="dialog" aria-label="60-second tour"
        style={{ maxWidth: 520, padding: '24px 28px' }}>
        <div style={{ fontSize: 11, letterSpacing: '.22em', color: 'var(--dim)' }}>60-SECOND TOUR · EVIDENCE ONLY</div>
        <h2 style={{ margin: '10px 0 8px', fontSize: 20 }}>{s.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--txt)' }}>{s.body}</p>
        <div style={{ display: 'flex', gap: 6, margin: '14px 0 18px' }} aria-hidden>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} style={{
              width: 26, height: 4, borderRadius: 2,
              background: i === step ? 'var(--amber)' : 'var(--line)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
          {!last && <button className="btn btn-gold" onClick={() => setStep(step + 1)}>Next →</button>}
          {s.cta === 'open-intake' && (
            <button className="btn btn-gold" onClick={() => { onClose(); onOpenIntake(); }}>
              ＋ Open intake form
            </button>
          )}
          {last && !s.cta && (
            <button className="btn btn-gold" onClick={() => { onClose(); onOpenIntake(); }}>
              ＋ Start my first trace
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>
            {last ? 'Close' : 'Skip tour'}
          </button>
        </div>
        <div className="dim mono" style={{ fontSize: 10, marginTop: 12 }}>← → keys se aage-peeche · Esc se band karo</div>
      </div>
    </div>
  );
}
