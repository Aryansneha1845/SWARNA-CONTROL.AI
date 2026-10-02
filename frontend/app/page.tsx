'use client';
/* SWARNA-CONTROL.AI — INVESTIGATION COMMAND CENTER.
   Backend + security + compliance preserved: same-origin /api proxy, DPDP consent gate,
   PII masking, legal routes (/privacy /terms /cookies /refunds) linked below. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, PRESETS } from '../lib/api';
import { buildCase, T_MAX, REPLAY_SCRIPT, type CaseModel, type Rail } from '../lib/model';
import Graph2D from '../components/graph2d';
import Timeline from '../components/timeline';
import Palette, { type PaletteCmd } from '../components/palette';
import Tutorial, { WHAT_IT_DOES } from '../components/tutorial';
import { EntityInspector, EvidencePanel, RiskOrb, CrossRailView, IntelPanel, ControlPanel, CaseOverview } from '../components/panels';

type View = 'graph' | 'crossrail' | 'overview';
type RightTab = 'inspect' | 'evidence' | 'intel' | 'risk' | 'control';

export default function CommandCenter() {
  const [entered, setEntered] = useState(false);
  const [heroExit, setHeroExit] = useState(false);
  const [caseData, setCaseData] = useState<CaseModel | null>(null);
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  const [view, setView] = useState<View>('graph');
  const [rightTab, setRightTab] = useState<RightTab>('inspect');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEv, setSelectedEv] = useState<string | null>(null);
  const [railFilter, setRailFilter] = useState<Rail | 'ALL'>('ALL');
  const [sceneKey, setSceneKey] = useState(0);

  const [time, setTime] = useState(T_MAX);
  const [playing, setPlaying] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [speed, setSpeed] = useState(1);
  const [replaying, setReplaying] = useState(false);
  const [replayIdx, setReplayIdx] = useState(-1);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [mask, setMask] = useState(true);
  const [consent, setConsent] = useState(false);
  const [fMsg, setFMsg] = useState(PRESETS.praveen.message);
  const [fUpi, setFUpi] = useState(PRESETS.praveen.upi);
  const [fHash, setFHash] = useState(PRESETS.praveen.hash);

  useEffect(() => { api.health().then(h => setBackendOk(!!h?.ok)).catch(() => setBackendOk(false)); }, []);

  /* 4D clock */
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setTime(t => {
        const n = t + dir * speed * 1.5;
        if (n >= T_MAX) { setPlaying(false); setReplaying(false); return T_MAX; }
        if (n <= 0) { setPlaying(false); return 0; }
        return n;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [playing, dir, speed]);

  const startReplay = useCallback(() => {
    setView('graph'); setTime(0); setDir(1); setPlaying(true); setReplaying(true); setReplayIdx(-1);
  }, []);
  useEffect(() => {
    if (!replaying) return;
    const texts = [0, 8, 16, 31, 47, 60, 85];
    const i = texts.filter(t => t <= time).length - 1;
    setReplayIdx(i);
  }, [time, replaying]);

  const runTrace = useCallback(async () => {
    if (!consent || loading) return;
    setLoading(true); setLoadMsg('Parsing message entities…');
    try {
      const inv = await api.investigate(fMsg, fUpi, fHash);
      setLoadMsg('Resolving cross-rail links…');
      const p = await api.controlPack(fUpi, inv.upi || {}, inv.entities || [], inv.current_destination).catch(() => null);
      const c = buildCase(inv, p);
      setPack(p); setCaseData(c);
      setSelectedId('wallet_main'); setSelectedEv(null);
      setTime(T_MAX); setPlaying(false); setReplaying(false);
      setRailFilter('ALL'); setView('graph'); setRightTab('inspect');
      setIntakeOpen(false);
      if (!entered) { setHeroExit(true); setTimeout(() => setEntered(true), 650); }
    } catch (e: any) {
      alert(`Investigation failed: ${e?.message || e}. Start backend (run_backend.bat) and frontend first.`);
    }
    setLoading(false); setLoadMsg('');
  }, [consent, loading, fMsg, fUpi, fHash, entered]);

  const speak = useCallback((t: string) => {
    try { const u = new SpeechSynthesisUtterance(t); u.lang = 'hi-IN'; speechSynthesis.cancel(); speechSynthesis.speak(u); }
    catch { alert('Browser audio unavailable.'); }
  }, []);

  const exportCase = useCallback(() => {
    if (!caseData) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(caseData, null, 2)], { type: 'application/json' }));
    a.download = `${caseData.caseId}.json`; a.click();
  }, [caseData]);

  const resetViz = useCallback(() => {
    setSelectedId(null); setSelectedEv(null); setRailFilter('ALL'); setTime(T_MAX);
    setPlaying(false); setReplaying(false); setSceneKey(k => k + 1);
  }, []);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName || '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      else if (e.key === 'Escape') { setPaletteOpen(false); setIntakeOpen(false); }
      else if (!typing && entered && caseData) {
        if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
        else if (e.key.toLowerCase() === 'r') startReplay();
        else if (e.key === '1') setView('graph');
        else if (e.key === '2') setView('crossrail');
        else if (e.key === '3') setView('overview');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entered, caseData, startReplay]);

  const commands: PaletteCmd[] = useMemo(() => {
    const base: PaletteCmd[] = [
      { label: 'New investigation (paste message + UPI + hash)', hint: 'CTRL+K', run: () => setIntakeOpen(true) },
      { label: 'Start replay investigation', hint: 'R', run: startReplay },
      { label: caseData && playing ? 'Pause timeline' : 'Play timeline', hint: 'SPACE', run: () => setPlaying(p => !p) },
      { label: 'Focus graph (clear selection)', hint: '1', run: () => { setView('graph'); setSelectedId(null); } },
      { label: 'Open cross-rail view', hint: '2', run: () => setView('crossrail') },
      { label: 'Open case overview', hint: '3', run: () => setView('overview') },
      { label: 'Filter rail: UPI', hint: 'FILTER', run: () => setRailFilter('upi') },
      { label: 'Filter rail: Crypto', hint: 'FILTER', run: () => setRailFilter('crypto') },
      { label: 'Filter rail: All', hint: 'FILTER', run: () => setRailFilter('ALL') },
      { label: 'Show evidence panel', hint: 'PANEL', run: () => setRightTab('evidence') },
      { label: 'Show SWARNA intelligence', hint: 'PANEL', run: () => setRightTab('intel') },
      { label: 'Export investigation (JSON)', hint: 'FILE', run: exportCase },
      { label: 'Reset visualization', hint: 'VIEW', run: resetViz },
    ];
    if (!caseData) return base;
    caseData.nodes.forEach(n => base.push({ label: `Focus entity ${n.short}`, hint: '__select:' + n.id, run: () => { setView('graph'); setSelectedId(n.id); setRightTab('inspect'); } }));
    caseData.evidence.forEach(e => base.push({ label: `Inspect ${e.id}`, hint: '__ev:' + e.id, run: () => { setSelectedEv(e.id); setRightTab('evidence'); } }));
    return base;
  }, [caseData, playing, startReplay, exportCase, resetViz]);

  const pinEvidence = useCallback((entityId: string) => {
    setView('graph'); setSelectedId(entityId); setRightTab('inspect');
  }, []);

  const activeEvents = caseData?.events.filter(e => e.t <= time).length ?? 0;

  return (
    <div className="cc-root">
      {/* ---------- TOP BAR ---------- */}
      <header className="cc-topbar">
        <div className="brand">SWARNA-<b>CONTROL.AI</b></div>
        <span className="case-chip">{caseData ? caseData.caseId : 'NO ACTIVE CASE'}</span>
        <span className="case-chip">{caseData ? (replaying ? 'REPLAY' : playing ? 'TRACING TIME' : 'UNDER REVIEW') : 'STANDBY'}</span>
        <div className="topbar-right">
          <span><span className="status-dot" /> SYSTEM ONLINE</span>
          <span>AI {backendOk === null ? '…' : backendOk ? 'READY' : 'OFFLINE'}</span>
          <span>EVIDENCE {caseData ? `${caseData.evidence.filter(e => e.status === 'VERIFIED' || e.status === 'CORRELATED').length}/${caseData.evidence.length} INTACT` : '—'}</span>
          <span>ANALYST</span>
        </div>
      </header>

      <div className="cc-body">
        {/* ---------- DOCK ---------- */}
        <nav className="cc-dock" aria-label="Investigation navigation">
          <button className={`dock-btn ${view === 'graph' ? 'active' : ''}`} title="Investigation graph (1)" onClick={() => setView('graph')}>◈</button>
          <button className={`dock-btn ${view === 'crossrail' ? 'active' : ''}`} title="Cross-rail view (2)" onClick={() => setView('crossrail')}>⇅</button>
          <button className={`dock-btn ${view === 'overview' ? 'active' : ''}`} title="Case overview (3)" onClick={() => setView('overview')}>▦</button>
          <div className="dock-sep" />
          <button className="dock-btn" title="Replay investigation (R)" onClick={startReplay}>↻</button>
          <button className="dock-btn" title="Command palette (Ctrl+K)" onClick={() => setPaletteOpen(true)}>⌘</button>
          <button className="dock-btn" title="Reset visualization" onClick={resetViz}>⟲</button>
          <button className="dock-btn" title="How it works — 60-sec tour" onClick={() => { setTourStep(0); setTourOpen(true); }}>?</button>
          <div className="dock-sep" />
          <button className="dock-btn" title="New investigation" onClick={() => setIntakeOpen(true)}>＋</button>
        </nav>

        {/* ---------- CENTER ---------- */}
        <section className="cc-canvas"
          onDrop={e => { const id = e.dataTransfer.getData('text/evidence-entity'); if (id) { e.preventDefault(); pinEvidence(id); } }}
          onDragOver={e => e.preventDefault()}
          aria-label="Investigation canvas">
          {view === 'graph' && (
            <>
              <div className="canvas-hud"><h2>INVESTIGATION SPACE · FLAT 2D</h2>
                <div className="sub">Entities · Relationships · TIME {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')} · {activeEvents}/{caseData?.events.length ?? 0} events</div>
              </div>
              <div className="rail-filter" role="group" aria-label="Rail filter">
                {(['ALL', 'upi', 'identity', 'crypto', 'message', 'evidence'] as const).map(r => (
                  <button key={r} className={`rail-btn ${railFilter === r ? 'active' : ''}`} onClick={() => setRailFilter(r)}>{r.toUpperCase()}</button>
                ))}
              </div>
              {caseData ? (
                <Graph2D caseData={caseData} time={time} selectedId={selectedId} onSelect={setSelectedId} railFilter={railFilter} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <div className="dim">No active case — initialize an investigation to materialize the space.</div>
                  <button className="btn btn-gold" onClick={() => setIntakeOpen(true)}>＋ NEW INVESTIGATION</button>
                  <button className="btn btn-ghost dim" style={{ fontSize: 12 }} onClick={() => { setTourStep(0); setTourOpen(true); }}>First time here? Take the 60-sec tour →</button>
                </div>
              )}
              {replaying && replayIdx >= 0 && (
                <div className="replay-banner">↻ {REPLAY_SCRIPT[Math.min(replayIdx, REPLAY_SCRIPT.length - 1)]}</div>
              )}
            </>
          )}
          {view === 'crossrail' && caseData && (
            <CrossRailView caseData={caseData} railFilter={railFilter} setRailFilter={setRailFilter} onSelect={id => { setSelectedId(id); setRightTab('inspect'); }} />
          )}
          {view === 'overview' && caseData && <CaseOverview caseData={caseData} />}
          {(view !== 'graph' && !caseData) && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button className="btn btn-gold" onClick={() => setIntakeOpen(true)}>＋ NEW INVESTIGATION</button>
            </div>
          )}
        </section>

        {/* ---------- RIGHT ---------- */}
        <aside className="cc-right" aria-label="Intelligence panel">
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} role="tablist" aria-label="Panel tabs">
              {([['inspect', 'INSPECT'], ['evidence', 'EVIDENCE'], ['intel', 'INTEL'], ['risk', 'RISK'], ['control', 'CONTROL']] as [RightTab, string][]).map(([t, l]) => (
                <button key={t} role="tab" aria-selected={rightTab === t} className={`rail-btn ${rightTab === t ? 'active' : ''}`} onClick={() => setRightTab(t)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="panel" style={{ flex: 1, overflowY: 'auto' }}>
            {!caseData && <div className="dim">Run an investigation — intelligence materializes here.</div>}
            {caseData && rightTab === 'inspect' && <><h3>ENTITY PROFILE</h3><EntityInspector caseData={caseData} selectedId={selectedId} onSelect={setSelectedId} /></>}
            {caseData && rightTab === 'evidence' && <><h3>EVIDENCE VAULT</h3><EvidencePanel caseData={caseData} selectedEv={selectedEv} onSelect={setSelectedEv} onPin={pinEvidence} /></>}
            {caseData && rightTab === 'intel' && <><h3>SWARNA INTELLIGENCE</h3><IntelPanel caseData={caseData} /></>}
            {caseData && rightTab === 'risk' && <><h3>RISK SIGNALS</h3><RiskOrb caseData={caseData} selectedId={selectedId} onSelect={setSelectedId} /></>}
            {caseData && rightTab === 'control' && <><h3>INVESTIGATION CONTROL</h3><ControlPanel pack={pack} hindi={caseData.hindi} destination={caseData.destination} speak={speak} /></>}
          </div>
          <div className="panel">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <input type="checkbox" checked={mask} onChange={e => setMask(e.target.checked)} /> Mask PII
            </label>
            <div className="faint mono" style={{ fontSize: 10, marginTop: 6 }}>
              {mask ? 'Identifiers masked in this view.' : 'Unmasked — for jury demo only.'} Nothing is stored.
            </div>
            <nav aria-label="Legal" className="mono" style={{ fontSize: 10, marginTop: 8 }}>
              <a href="/privacy" style={{ color: '#5b6a7f' }}>Privacy</a>{' · '}
              <a href="/terms" style={{ color: '#5b6a7f' }}>Terms</a>{' · '}
              <a href="/cookies" style={{ color: '#5b6a7f' }}>Cookies</a>{' · '}
              <a href="/refunds" style={{ color: '#5b6a7f' }}>Refunds</a>
            </nav>
          </div>
        </aside>
      </div>

      {/* ---------- TIMELINE ---------- */}
      {caseData && (
        <Timeline time={time} setTime={setTime} playing={playing} setPlaying={setPlaying}
          dir={dir} setDir={setDir} speed={speed} setSpeed={setSpeed}
          events={caseData.events} onReplay={startReplay} replaying={replaying} />
      )}

      {/* ---------- HERO — flat KIBORI lockup, no 3D ---------- */}
      {!entered && (
        <div className={`hero-back ${heroExit ? 'exit' : ''}`}>
          <div className="hero-content">
            <div className="hero-tag">Vol. 01 — SANGYAN 2026</div>
            <h1>SWARNA</h1>
            <div className="hero-sub">Cross-rail investigation control room — message + UPI + crypto trail, evidence only.</div>
            <div className="hero-stats">
              <span><b>6</b>RAILS TRACED</span>
              <span><b>5</b>EVIDENCE STATES</span>
              <span><b>7</b>KILL-CHAIN STAGES</span>
              <span><b>0</b>DATA RETAINED</span>
            </div>
            {/* ---------- WHAT IT DOES — first-run explainer ---------- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: 26, textAlign: 'left' }}>
              {WHAT_IT_DOES.map(c => (
                <div key={c.title} style={{ border: '1px solid var(--line)', borderRadius: 2, padding: '12px 14px', background: 'rgba(16,23,36,.55)' }}>
                  <div style={{ fontSize: 16 }}>{c.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 4px' }}>{c.title}</div>
                  <div className="dim" style={{ fontSize: 12, lineHeight: 1.55 }}>{c.body}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-gold" style={{ fontSize: 13, padding: '12px 28px', letterSpacing: '.06em' }} onClick={() => setIntakeOpen(true)}>
                Commission — INITIALIZE INVESTIGATION
              </button>
              <button className="btn" style={{ fontSize: 13, padding: '12px 22px', letterSpacing: '.06em' }} onClick={() => { setTourStep(0); setTourOpen(true); }}>
                ❓ 60-SEC TOUR
              </button>
            </div>
            <div className="dim" style={{ marginTop: 14, fontSize: 12 }}>
              Free student prototype · {backendOk === false ? 'Backend offline — start run_backend.bat' : 'Evidence only, no tips'}
            </div>
          </div>
        </div>
      )}

      {/* ---------- INTAKE — expanding flat sheet (DPDP consent gate preserved) ---------- */}
      {intakeOpen && (
        <div className="palette-back" onClick={() => setIntakeOpen(false)}>
          <div className="palette palette-intake" onClick={e => e.stopPropagation()} role="dialog" aria-label="New investigation">
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--line)', fontSize: 11, letterSpacing: '.22em', color: 'var(--dim)' }}>NEW INVESTIGATION · EVIDENCE ONLY</div>
            <div style={{ padding: '28px', display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn" style={{ fontSize: 12 }} onClick={() => { setFMsg(PRESETS.praveen.message); setFUpi(PRESETS.praveen.upi); setFHash(PRESETS.praveen.hash); }}>Synthetic demo: Praveen</button>
                  <button className="btn" style={{ fontSize: 12 }} onClick={() => { setFMsg(PRESETS.kavita.message); setFUpi(PRESETS.kavita.upi); setFHash(PRESETS.kavita.hash); }}>Synthetic demo: Kavita</button>
                </div>
                <label className="dim" style={{ fontSize: 11, letterSpacing: '.12em' }} htmlFor="in-msg">SUSPICIOUS MESSAGE — YOUR OWN DATA ONLY</label>
                <textarea id="in-msg" className="field" rows={8} value={fMsg} onChange={e => setFMsg(e.target.value)} placeholder="Paste message text…" />
              </div>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <label className="dim" style={{ fontSize: 11, letterSpacing: '.12em' }} htmlFor="in-upi">UPI PAYMENT DETAILS</label>
                <textarea id="in-upi" className="field" rows={3} value={fUpi} onChange={e => setFUpi(e.target.value)} placeholder="abc-invest@upi, Rs 50,000…" />
                <label className="dim" style={{ fontSize: 11, letterSpacing: '.12em' }} htmlFor="in-hash">CRYPTO TX HASH (OPTIONAL)</label>
                <input id="in-hash" className="field mono" value={fHash} onChange={e => setFHash(e.target.value)} placeholder="0x…" />
                <label style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5 }} htmlFor="in-consent">
                  <input id="in-consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                  <span>I consent to processing this text for one investigation trail. My data, no OTPs, nothing stored. <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</a></span>
                </label>
                {loading && <div className="scanline" />}
                {loading && <div className="mono dim" style={{ fontSize: 12 }}>{loadMsg}</div>}
                <button className="btn btn-gold" disabled={!consent || loading}
                  style={!consent ? { opacity: 0.45 } : {}} onClick={runTrace}>
                  {loading ? 'INVESTIGATING…' : 'TRACE KARO — start investigation'}
                </button>
                <div className="dim mono" style={{ fontSize: 10 }}>Never OTPs or passwords · Nothing stored</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tutorial open={tourOpen} step={tourStep} setStep={setTourStep}
        onClose={() => setTourOpen(false)} onOpenIntake={() => setIntakeOpen(true)} />
      <Palette open={paletteOpen} setOpen={setPaletteOpen} caseData={caseData} commands={commands} />
    </div>
  );
}
