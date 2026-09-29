'use client';
/* Shared atoms: badges, status, metric objects with orbital rings + animated counters. */
import { useEffect, useRef, useState } from 'react';

export function Badge({ kind, children }: { kind: 'fact' | 'derived' | 'infer' | 'user' | 'hi' | 'md' | 'lo'; children: React.ReactNode }) {
  const cls = kind === 'fact' ? 'b-fact' : kind === 'derived' ? 'b-derived' : kind === 'infer' ? 'b-infer'
    : kind === 'user' ? 'b-user' : kind === 'hi' ? 'b-risk-hi' : kind === 'md' ? 'b-risk-md' : 'b-risk-lo';
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="status-dot" style={ok ? {} : { background: '#f04444', boxShadow: '0 0 8px #f04444' }} />
      {label}
    </span>
  );
}

export function MetricObject({ value, label, accent = '#22d3ee' }: { value: number; label: string; accent?: string }) {
  const [n, setN] = useState(0);
  const target = useRef(value);
  target.current = value;
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setN(value); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setN(Math.round(target.current * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <svg width="86" height="86" viewBox="0 0 86 86">
        <circle cx="43" cy="43" r="36" fill="none" stroke="#16202f" strokeWidth="5" />
        <circle cx="43" cy="43" r="36" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${Math.min(1, value / 100) * 226} 226`} transform="rotate(-90 43 43)" opacity={0.9} />
        <circle cx="43" cy="43" r="27" fill="none" stroke="#223047" strokeWidth="1" strokeDasharray="3 5" />
        <text x="43" y="49" textAnchor="middle" fill="#e8eef6" fontSize="17" fontWeight="700" fontFamily="JetBrains Mono, monospace">{n.toLocaleString('en-IN')}</text>
      </svg>
      <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#93a1b5', marginTop: 2 }}>{label}</div>
    </div>
  );
}
