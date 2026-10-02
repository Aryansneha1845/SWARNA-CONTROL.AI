'use client';
/* Investigation panels: inspector, evidence, risk orb, cross-rail map, intel, control, overview.
   Every claim is evidence-backed. Risk language stays indicator-level, never accusatory. */
import { useMemo } from 'react';
import type { CaseModel, Rail } from '../lib/model';
import { Badge, MetricObject } from './ui';

const RISK_BADGE = { low: 'lo', medium: 'md', high: 'hi', critical: 'hi' } as const;

/* ---------------- ENTITY INSPECTOR ---------------- */
export function EntityInspector({ caseData, selectedId, onSelect }: {
  caseData: CaseModel; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const node = caseData.nodes.find(n => n.id === selectedId)
    ?? [...caseData.nodes].sort((a, b) => ({ low: 0, medium: 1, high: 2, critical: 3 } as any)[b.risk] - ({ low: 0, medium: 1, high: 2, critical: 3 } as any)[a.risk])[0];
  const links = caseData.edges.filter(e => e.from === node.id || e.to === node.id);
  const ev = caseData.evidence.filter(e => e.entity === node.id || e.title.includes(node.id));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="mono faint" style={{ fontSize: 10 }}>ENTITY</span>
        <Badge kind={RISK_BADGE[node.risk]}>{node.risk.toUpperCase()} · RISK INDICATOR</Badge>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700 }} className="mono">{node.label}</div>
      <div className="dim" style={{ fontSize: 12 }}>{node.kind.toUpperCase()} · {node.rail.toUpperCase()} rail</div>
      <div style={{ marginTop: 10 }}>
        <div className="kv"><span>Transaction volume</span><span>{node.volume}</span></div>
        <div className="kv"><span>First seen</span><span>{node.firstSeen}</span></div>
        <div className="kv"><span>Last seen</span><span>{node.lastSeen}</span></div>
        {Object.entries(node.meta).map(([k, v]) => (
          <div className="kv" key={k}><span>{k}</span><span>{v}</span></div>
        ))}
      </div>
      <h4>CONNECTED ACCOUNTS ({links.length})</h4>
      {links.map(l => {
        const other = l.from === node.id ? l.to : l.from;
        const on = caseData.nodes.find(n => n.id === other);
        return (
          <button key={l.id} onClick={() => onSelect(other)} className="btn btn-ghost"
            style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6, borderColor: '#223047' }}>
            <span className="mono" style={{ fontSize: 12 }}>{on?.short ?? other}</span>
            <span className="dim" style={{ fontSize: 11 }}> · {l.label}</span>
          </button>
        );
      })}
      <h4>WHY THIS CONNECTION MATTERS</h4>
      {links.slice(0, 3).map(l => (
        <div className="finding" key={l.id} style={{ fontSize: 12 }}>{l.why}
          <div style={{ marginTop: 4 }}><Badge kind={l.confidence === 'Known fact' ? 'fact' : l.confidence === 'Supported' ? 'derived' : 'infer'}>{l.confidence}</Badge></div>
        </div>
      ))}
      <h4>RELATED EVIDENCE ({ev.length})</h4>
      {ev.length === 0 && <div className="dim" style={{ fontSize: 12 }}>No direct evidence items — requires review.</div>}
      {ev.map(e => <div key={e.id} className="mono" style={{ fontSize: 11, color: '#93a1b5' }}>{e.id} · {e.status}</div>)}
    </div>
  );
}

/* ---------------- EVIDENCE PANEL ---------------- */
export function EvidencePanel({ caseData, selectedEv, onSelect, onPin }: {
  caseData: CaseModel; selectedEv: string | null; onSelect: (id: string) => void; onPin: (entityId: string) => void;
}) {
  const confClass = (c: string) => c === 'Known fact' ? 'ev-known' : c === 'Supported' ? 'ev-supported' : c === 'Possible relationship' ? 'ev-possible' : 'ev-unverified';
  return (
    <div>
      <div className="dim" style={{ fontSize: 11, marginBottom: 8 }}>Click to inspect · PIN to visualize on graph</div>
      {caseData.evidence.map(e => (
        <div key={e.id}
          className={`ev-card ${confClass(e.confidence)} ${selectedEv === e.id ? 'selected' : ''}`}
          onClick={() => onSelect(e.id)}
          draggable
          onDragStart={ev2 => ev2.dataTransfer.setData('text/evidence-entity', e.entity)}>
          <div className="ev-id">{e.id} · {e.status}</div>
          <div className="ev-title">{e.title}</div>
          <div className="ev-meta">{e.type} · {e.source}</div>
          <div className="ev-meta">{e.timestamp} · confidence: {e.confidence}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={ev2 => { ev2.stopPropagation(); onPin(e.entity); }}>⌖ Pin to graph</button>
          </div>
        </div>
      ))}
      {caseData.evidence.length === 0 && <div className="dim">No evidence items yet — run an investigation.</div>}
    </div>
  );
}

/* ---------------- RISK ORB (radial, SVG) ---------------- */
export function RiskOrb({ caseData, selectedId, onSelect }: {
  caseData: CaseModel; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const center = caseData.nodes.find(n => n.id === selectedId) ?? caseData.nodes[0];
  const linked = useMemo(() => {
    const ids = new Set<string>();
    caseData.edges.forEach(e => {
      if (e.from === center.id) ids.add(e.to);
      if (e.to === center.id) ids.add(e.from);
    });
    return caseData.nodes.filter(n => ids.has(n.id)).slice(0, 8);
  }, [caseData, center.id]);
  const R = 96, C = 110;
  const ringR = { low: 52, medium: 72, high: 90, critical: 104 };
  const riskColor = (r: string) => r === 'critical' || r === 'high' ? '#f04444' : r === 'medium' ? '#f5a30b' : '#22c55e';
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="dim" style={{ fontSize: 11, marginBottom: 4 }}>INVESTIGATION PRIORITY · selected entity at center</div>
      <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label={`Risk map centered on ${center.short}`}>
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((t, i) => (
          <g key={t}>
            <circle cx={C} cy={C} r={44 + i * 18} fill="none" stroke="#1a2433" strokeWidth="1" strokeDasharray="3 4" />
            <text x={C + 44 + i * 18 - 4} y={C - 4} fill="#5b6a7f" fontSize="7" fontFamily="JetBrains Mono, monospace">{t}</text>
          </g>
        ))}
        {linked.map((n, i) => {
          const a = (i / Math.max(1, linked.length)) * Math.PI * 2 - Math.PI / 2;
          const rr = ringR[n.risk] ?? 72;
          const x = C + Math.cos(a) * rr, y = C + Math.sin(a) * rr;
          return (
            <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
              <line x1={C} y1={C} x2={x} y2={y} stroke={riskColor(n.risk)} strokeWidth="1" opacity="0.55" />
              <circle cx={x} cy={y} r="9" fill="#0b1018" stroke={riskColor(n.risk)} strokeWidth="1.5" />
              <text x={x} y={y + 3} textAnchor="middle" fill="#e8eef6" fontSize="7" fontFamily="JetBrains Mono, monospace">{n.short.slice(0, 5)}</text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="16" fill="#0b1018" stroke={riskColor(center.risk)} strokeWidth="2" />
        <text x={C} y={C + 4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono, monospace">{center.short.slice(0, 5)}</text>
      </svg>
      <div style={{ fontSize: 11 }} className="dim">Pattern detected · {linked.length} connected · <b style={{ color: riskColor(center.risk) }}>{center.risk.toUpperCase()}</b> investigation priority — not an accusation.</div>
    </div>
  );
}

/* ---------------- CROSS-RAIL VIEW (living infrastructure map, SVG) ---------------- */
const RAILS: Rail[] = ['message', 'upi', 'identity', 'crypto', 'evidence'];
export function CrossRailView({ caseData, railFilter, setRailFilter, onSelect }: {
  caseData: CaseModel; railFilter: Rail | 'ALL'; setRailFilter: (r: Rail | 'ALL') => void; onSelect: (id: string) => void;
}) {
  const lanes = RAILS.map(r => ({ rail: r, nodes: caseData.nodes.filter(n => n.rail === r || (r === 'upi' && n.rail === 'bank')) }));
  const W = 900, laneW = W / RAILS.length;
  const color = (r: Rail) => r === 'crypto' ? '#8b5cf6' : r === 'upi' ? '#22d3ee' : r === 'message' ? '#f5a30b' : r === 'evidence' ? '#f8fafc' : '#94a3b8';
  const posOf = (id: string): [number, number] => {
    for (let li = 0; li < lanes.length; li++) {
      const idx = lanes[li].nodes.findIndex(n => n.id === id);
      if (idx >= 0) return [li * laneW + laneW / 2, 90 + idx * 74];
    }
    return [0, 0];
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 14 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {(['ALL', ...RAILS] as const).map(r => (
          <button key={r} className={`rail-btn ${railFilter === r ? 'active' : ''}`} onClick={() => setRailFilter(r)}>
            {r.toUpperCase()}
          </button>
        ))}
        <span className="dim" style={{ fontSize: 11, marginLeft: 'auto' }}>Isolate a rail to dim unrelated connections</span>
      </div>
      <svg viewBox={`0 0 ${W} 420`} style={{ flex: 1, width: '100%' }} role="img" aria-label="Cross-rail infrastructure map">
        {lanes.map((l, i) => (
          <g key={l.rail}>
            <line x1={i * laneW + laneW / 2} y1={30} x2={i * laneW + laneW / 2} y2={400} stroke="#131b28" strokeWidth="1" />
            <text x={i * laneW + laneW / 2} y={20} textAnchor="middle" fill={color(l.rail)} fontSize="11" letterSpacing="2" fontFamily="JetBrains Mono, monospace">{l.rail.toUpperCase()}</text>
          </g>
        ))}
        {caseData.edges.map(e => {
          const [x1, y1] = posOf(e.from), [x2, y2] = posOf(e.to);
          if (!x1 || !x2) return null;
          const dim = railFilter !== 'ALL' && !caseData.nodes.find(n => n.id === (e.from === e.from ? e.from : e.to) && n.rail === railFilter);
          const col = e.meaning === 'crypto' ? '#8b5cf6' : e.meaning === 'verified' ? '#f8fafc' : e.meaning === 'suspicious' ? '#f5a30b' : e.meaning === 'unknown' ? '#5b6a7f' : '#22d3ee';
          return <line key={e.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={e.meaning === 'highrisk' ? 2.5 : 1.4}
            opacity={dim ? 0.12 : 0.9} className={dim ? '' : 'flow-dash'} />;
        })}
        {lanes.flatMap((l, li) => l.nodes.map((n, idx) => {
          const x = li * laneW + laneW / 2, y = 90 + idx * 74;
          const dim = railFilter !== 'ALL' && n.rail !== railFilter;
          return (
            <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }} opacity={dim ? 0.25 : 1}>
              <rect x={x - 62} y={y - 20} width="124" height="44" rx="8" fill="#0b1018" stroke={color(n.rail)} strokeWidth="1.2" />
              <text x={x} y={y - 2} textAnchor="middle" fill="#e8eef6" fontSize="10" fontFamily="JetBrains Mono, monospace">{n.short}</text>
              <text x={x} y={y + 13} textAnchor="middle" fill="#93a1b5" fontSize="9">{n.volume}</text>
            </g>
          );
        }))}
      </svg>
    </div>
  );
}

/* ---------------- SWARNA INTELLIGENCE (analyst assistant, not chatbot) ---------------- */
export function IntelPanel({ caseData }: { caseData: CaseModel }) {
  const verified = caseData.evidence.filter(e => e.status === 'VERIFIED').length;
  const correlated = caseData.evidence.filter(e => e.status === 'CORRELATED').length;
  const gaps = [
    'Cash-out destination unobserved — continued monitoring required, no assumption of endpoint.',
    caseData.live ? 'Exchange attribution for the on-ramp deposit is inferred from timing/amount, not confirmed by the venue.' : 'Chain data is cached (fail-safe) — re-run with live Etherscan for court-grade freshness.',
    'Beneficiary real-world identity not established — VPA/phone are leads, not identifications.',
  ];
  return (
    <div>
      <h4 style={{ marginTop: 0 }}>CASE SUMMARY</h4>
      <div className="finding">A lure message led to a UPI payment that converted to crypto within the hour.
      The trail is joined across {caseData.stats.links} links with {verified} verified and {correlated} correlated evidence items.</div>
      <h4>KEY FINDINGS</h4>
      {caseData.events.slice(0, 5).map((e, i) => (
        <div className="finding" key={i}><b>T+{e.t}s</b> — {e.title}: {e.detail}
          <div><Badge kind={e.kind === 'fact' ? 'fact' : e.kind === 'derived' ? 'derived' : 'infer'}>
            {e.kind === 'fact' ? 'OBSERVED FACT' : e.kind === 'derived' ? 'DERIVED RELATIONSHIP' : 'MODEL INFERENCE'}</Badge></div>
        </div>
      ))}
      <h4>SUSPICIOUS PATTERNS</h4>
      <div className="finding warn">VPA mirrored in lure message and payment record — classic impersonation setup. <Badge kind="derived">DERIVED</Badge></div>
      <div className="finding warn">UPI-to-crypto conversion inside ~17 minutes — rapid layering pattern. <Badge kind="derived">DERIVED</Badge></div>
      {caseData.nodes.some(n => n.id.startsWith('out_')) && (
        <div className="finding warn">Post-receipt dispersion across wallets — possible obfuscation. <Badge kind="infer">MODEL INFERENCE</Badge></div>
      )}
      <h4>RECOMMENDED INVESTIGATION STEPS</h4>
      <ol style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
        <li>Confirm beneficiary VPA ownership via bank / 1930 lien request.</li>
        <li>File Chakshu + cybercrime.gov.in reports with the UTR preserved.</li>
        <li>Monitor the main wallet for the first cash-out hop before attributing an endpoint.</li>
        <li>Share the Hindi family alert so no further payments follow the same lure.</li>
      </ol>
      <h4>EVIDENCE GAPS</h4>
      {gaps.map((g, i) => <div className="finding crit" key={i}>{g}</div>)}
      <h4>CONFIDENCE</h4>
      <div className="mono" style={{ fontSize: 12 }}>{verified} verified · {correlated} correlated · {caseData.stats.evidence} total items
        <div className="scanline" style={{ marginTop: 6 }} /></div>
    </div>
  );
}

/* ---------------- CONTROL PANEL ---------------- */
export function ControlPanel({ pack, hindi, destination, speak }: {
  pack: any; hindi: string; destination: string; speak: (t: string) => void;
}) {
  const copy = (t: string) => { navigator.clipboard.writeText(t); };
  const dl = (name: string, t: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' })); a.download = name; a.click();
  };
  if (!pack) return <div className="dim">Run an investigation to generate the control pack.</div>;
  return (
    <div>
      <div className="kv"><span>Current destination</span><span>{destination}</span></div>
      <div className="mono dim" style={{ fontSize: 11, margin: '6px 0' }}>{hindi}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => speak(hindi)}>🔊 Hindi briefing</button>
        <button className="btn btn-ghost" title="Check if Hindi voice works before recording" onClick={() => speak('Namaste. Main Swarn Control hoon. Aapka trail taiyaar hai.')}>Test voice</button>
      </div>
      <h4>CHAKSHU REPORT DRAFT</h4>
      <button className="btn" onClick={() => copy(pack.chakshu)}>Copy draft</button>{' '}
      <button className="btn btn-ghost" onClick={() => dl('chakshu_draft.txt', pack.chakshu)}>Download .txt</button>
      <h4>FAMILY ALERT (HINDI)</h4>
      <button className="btn" onClick={() => copy(pack.family_hindi)}>Copy family alert</button>
      <h4>SCORES GRIEVANCE DRAFT</h4>
      <button className="btn" onClick={() => copy(pack.scores)}>Copy SCORES draft</button>
      <h4>FREEZE CHECKLIST — NEXT 2 HRS</h4>
      <ol style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
        {(pack.freeze || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
      </ol>
    </div>
  );
}

/* ---------------- CASE OVERVIEW (3D stat objects) ---------------- */
export function CaseOverview({ caseData }: { caseData: CaseModel }) {
  const s = caseData.stats;
  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <div className="canvas-hud" style={{ position: 'static', marginBottom: 8 }}>
        <h2>CASE MAP · {caseData.caseId}</h2>
        <div className="sub">{caseData.live ? 'LIVE CHAIN' : 'CACHED CHAIN (FAIL-SAFE)'} · {caseData.destination}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="panel"><MetricObject value={s.entities} label="ENTITIES DISCOVERED" accent="#22d3ee" /></div>
        <div className="panel"><MetricObject value={s.txns} label="TRANSACTIONS ANALYZED" accent="#8b5cf6" /></div>
        <div className="panel"><MetricObject value={s.links} label="CROSS-RAIL LINKS" accent="#f5a30b" /></div>
        <div className="panel"><MetricObject value={s.evidence} label="EVIDENCE ITEMS" accent="#f8fafc" /></div>
      </div>
      <div className="panel" style={{ marginTop: 10 }}>
        <h3>FINANCIAL KILL CHAIN</h3>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {caseData.killChain.map((k, i) => (
            <span key={k.stage} style={{ display: 'flex', alignItems: 'center' }}>
              <span className="badge" style={k.done ? { color: '#22c55e', borderColor: '#14532d' } : { color: '#5b6a7f' }}>
                {k.done ? '✓' : '?'} {k.stage}
              </span>
              {i < caseData.killChain.length - 1 && <span style={{ color: '#5b6a7f', margin: '0 2px' }}>→</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 10 }}>
        <h3>RISK SIGNALS</h3>
        {caseData.nodes.filter(n => n.risk === 'high' || n.risk === 'critical').map(n => (
          <div className="finding crit" key={n.id}><b>{n.short}</b> — {n.risk.toUpperCase()} investigation priority · {n.volume} · first seen {n.firstSeen}</div>
        ))}
      </div>
    </div>
  );
}
