'use client';
import { useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const PRAVEEN_MSG = `Bhai good news! SEBI approved scheme hai, 2 din me double.\nPay Rs 50,000 to our investment partner abc-invest@upi pe bhejo.\nUPI ID: abc-invest@upi\nPhone: +91 98765 43210\nWebsite: www.abc-invest-profits.com\nTelegram: @abc_invest_official`;
const PRAVEEN_UPI = `abc-invest@upi, Rs 50,000, 12:41 PM, UTR426118473902`;
const PRAVEEN_HASH = `0x81F4a2c9d3E7b1A05c8D2f4e6A0b3C7d9E1f2A4b5c7d9e1f2a4b5c7d9e1f2a4b5c7d9e1f2`;
const KAVITA_MSG = `Namaste Kavita ji, NSDL se bol rahe hain. Rs 25,000 processing fee kavita-family@paytm pe bhejo, 5 lakh release hoga. Website: www.nsdl-unclaim-release.com Phone: +91 91234 56780`;

function confClass(c: string) {
  if (c === 'Known fact') return 'ev-known';
  if (c === 'Supported') return 'ev-supported';
  if (c === 'Possible relationship') return 'ev-possible';
  return 'ev-unverified';
}

export default function Page() {
  const [message, setMessage] = useState(PRAVEEN_MSG);
  const [upiText, setUpiText] = useState(PRAVEEN_UPI);
  const [hash, setHash] = useState(PRAVEEN_HASH);
  const [result, setResult] = useState<any>(null);
  const [pack, setPack] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mask, setMask] = useState(true);

  async function trace() {
    setLoading(true); setPack(null); setSelected(null);
    try {
      const r = await fetch(`${API}/investigate`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: message, upi_text: upiText, upi: {}, tx_hash: hash }) });
      const j = await r.json();
      setResult(j); setSelected(j.links?.[0] || null);
      const p = await fetch(`${API}/control-pack`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upi_text: upiText, upi: j.upi || {}, entities: j.entities || [], current_destination: j.current_destination }) });
      setPack(await p.json());
    } catch (e) { alert('Backend not running. cd backend; uvicorn main:app --reload'); }
    setLoading(false);
  }

  function copyText(t: string) { navigator.clipboard.writeText(t); alert('Copied!'); }
  function download(name: string, t: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
    a.download = name; a.click();
  }
  function speakHindi(t: string) {
    try {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'hi-IN'; speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { alert('Browser audio not available'); }
  }

  const nodes = result ? [
    { id: 'message', position: { x: 20, y: 60 }, data: { label: 'MESSAGE · Lure' } },
    { id: 'upi_payment', position: { x: 260, y: 60 }, data: { label: `UPI · ${result.upi?.amount_inr || '50,000'} · 12:41` } },
    { id: 'crypto_onramp', position: { x: 500, y: 60 }, data: { label: 'ON-RAMP · 12:58 · USDT' } },
    { id: 'wallet_main', position: { x: 740, y: 60 }, data: { label: 'Wallet · 0x81F…' } },
  ] : [];
  const edges = (result?.links || []).slice(0, 3).map((l: any, i: number) => ({
    id: `e${i}`, source: l.from_id, target: l.to_id, label: l.confidence,
    style: { stroke: l.confidence === 'Known fact' ? '#22c55e' : l.confidence === 'Supported' ? '#3b82f6' : '#f59e0b', strokeWidth: 2.5 },
  }));

  return (
    <main style={{ minHeight: '100vh', padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1>SWARN-CONTROL.AI <span style={{ color: '#f59e0b' }}>Control Room</span></h1>
      <p>Hum chat nahi karte, trail reconstruct karte hain. No tips. Evidence only. PII masked by default.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setMessage(PRAVEEN_MSG); setUpiText(PRAVEEN_UPI); setHash(PRAVEEN_HASH); }}>Praveen 50k case</button>
        <button onClick={() => { setMessage(KAVITA_MSG); setUpiText('kavita-family@paytm, Rs 25,000'); setHash(''); }}>Kavita backup case</button>
        <label style={{ marginLeft: 'auto' }}><input type="checkbox" checked={mask} onChange={e => setMask(e.target.checked)} /> Mask PII</label>
      </div>
      <div className="grid3">
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="1. WhatsApp/Telegram message" rows={7} className="card" style={{ color: '#fff' }} />
        <textarea value={upiText} onChange={e => setUpiText(e.target.value)} placeholder="2. UPI details / screenshot text (OCR text paste karo)" rows={7} className="card" style={{ color: '#fff' }} />
        <textarea value={hash} onChange={e => setHash(e.target.value)} placeholder="3. Crypto tx hash (0x…)" rows={7} className="card" style={{ color: '#fff' }} />
      </div>
      <button onClick={trace} disabled={loading} style={{ marginTop: 12, background: '#f59e0b', color: '#000', padding: '12px 28px', fontWeight: 800, border: 0, borderRadius: 8 }}>
        {loading ? 'Tracing…' : 'TRACE KARO'}
      </button>
      {result && (<>
        <div className="card" style={{ height: 340, marginTop: 16, padding: 0, overflow: 'hidden' }}>
          <ReactFlow nodes={nodes} edges={edges}
            onEdgeClick={(_, e) => setSelected(result.links.find((l: any) => l.from_id === e.source && l.to_id === e.target) || result.links[0])}
            fitView><Background /><Controls /></ReactFlow>
        </div>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Tip: edge pe click karo — kyun joda, wo Evidence Card me dikhega. {result.chain?.cached ? '(cached chain — live fail-safe)' : '(live chain)'}</p>
        <div className="grid3" style={{ marginTop: 12 }}>
          <div className={`card ${confClass(selected?.confidence || '')}`}>
            <h3>Evidence Card · {selected?.confidence}</h3>
            <p><b>{selected?.from_id} → {selected?.to_id}</b></p>
            <p>{selected?.why}</p>
            <ul>{(selected?.evidence || []).map((e: string, i: number) => <li key={i}>{mask ? e.replace(/abc-invest@upi/g, 'ab***@upi').replace(/98765\s?43210/g, '******3210') : e}</li>)}</ul>
            <hr />
            {(result.links || []).map((l: any, i: number) => (
              <button key={i} onClick={() => setSelected(l)} style={{ margin: 4, padding: '6px 10px' }}>{l.from_id}→{l.to_id}</button>
            ))}
          </div>
          <div className="card">
            <h3>Kill Chain</h3>
            {Object.entries(result.kill_chain || {}).map(([k, v]: any) => (<div key={k}>{v ? '✓' : '?'} {k}</div>))}
            <p style={{ marginTop: 8 }}>{result.hindi_summary}</p>
            <button onClick={() => speakHindi(result.hindi_summary)}>🔊 Hindi me suno</button>
            <h4>Before / After wallet</h4>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify({ before: result.chain?.before, after: result.chain?.after }, null, 2)}</pre>
          </div>
          <div className="card">
            <h3>Control Panel</h3>
            <p style={{ fontSize: 12 }}>Current: {result.current_destination}</p>
            <button onClick={() => pack && copyText(pack.chakshu)}>Chakshu draft copy</button>{' '}
            <button onClick={() => pack && download('chakshu_draft.txt', pack.chakshu)}>Download</button>
            <div style={{ marginTop: 8 }}><button onClick={() => pack && copyText(pack.family_hindi)}>Family alert (Hindi) copy</button></div>
            <div style={{ marginTop: 8 }}><button onClick={() => pack && copyText(pack.scores)}>SCORES draft copy</button></div>
            <h4>Freeze checklist (next 2 hrs)</h4>
            <ol>{(pack?.freeze || []).map((f: string, i: number) => <li key={i}>{f}</li>)}</ol>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Entities (message se)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(result.entities || []).map((e: any, i: number) => (
              <span key={i} style={{ background: '#1f2937', padding: '4px 10px', borderRadius: 20, fontSize: 13 }}>{e.type}: {mask && e.type === 'upi' ? e.value.slice(0, 2) + '***' : e.value}</span>
            ))}
          </div>
        </div>
      </>)}
    </main>
  );
}
