'use client';
/* Command palette: Ctrl+K — commands + global search across entities, wallets, evidence, events. */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CaseModel } from '../lib/model';

export interface PaletteCmd { label: string; hint: string; run: () => void; }

export default function Palette({ open, setOpen, caseData, commands }: {
  open: boolean; setOpen: (b: boolean) => void; caseData: CaseModel | null; commands: PaletteCmd[];
}) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 30); } }, [open ]);
  const items: PaletteCmd[] = useMemo(() => {
    const ql = q.toLowerCase().trim();
    const cmds = commands.filter(c => !ql || c.label.toLowerCase().includes(ql));
    if (!caseData || !ql) return cmds;
    const hits: PaletteCmd[] = [];
    caseData.nodes.filter(n => (n.label + n.short + n.id).toLowerCase().includes(ql)).slice(0, 5)
      .forEach(n => hits.push({ label: `Focus entity ${n.short} — ${n.label}`, hint: 'ENTITY', run: () => commands.find(c => c.hint === '__select:' + n.id)?.run() ?? undefined as any }));
    caseData.evidence.filter(e => (e.id + e.title).toLowerCase().includes(ql)).slice(0, 4)
      .forEach(e => hits.push({ label: `${e.id} — ${e.title}`, hint: 'EVIDENCE', run: () => commands.find(c => c.hint === '__ev:' + e.id)?.run() ?? undefined as any }));
    return [...hits, ...cmds];
  }, [q, commands, caseData]);

  useEffect(() => setIdx(0), [q]);
  if (!open) return null;
  return (
    <div className="palette-back" onClick={() => setOpen(false)}>
      <div className="palette" onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <input ref={input} value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search entity, UPI ID, transaction, wallet, evidence…  (Esc to close)"
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
            if (e.key === 'Enter' && items[idx]) { setOpen(false); items[idx].run(); }
            if (e.key === 'Escape') setOpen(false);
          }} />
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {items.map((c, i) => (
            <div key={i} className={`palette-item ${i === idx ? 'active' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { setOpen(false); c.run(); }}>
              <span>{c.label}</span><span className="k">{c.hint}</span>
            </div>
          ))}
          {items.length === 0 && <div className="palette-item">No matches — try a UPI ID, wallet, or evidence ID.</div>}
        </div>
      </div>
    </div>
  );
}
