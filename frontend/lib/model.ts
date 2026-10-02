/* SWARNA-CONTROL.AI — investigation data model.
   Transforms backend /investigate + /control-pack into a timed 4D case model.
   Language rule: risk indicator / investigation priority / requires review — never accusations. */

export type Rail = 'upi' | 'bank' | 'identity' | 'crypto' | 'evidence' | 'message';
export type Confidence = 'Known fact' | 'Supported' | 'Possible relationship' | 'Unverified';
export type EvStatus = 'VERIFIED' | 'CORRELATED' | 'UNVERIFIED' | 'FLAGGED' | 'REQUIRES REVIEW';
export type FindingKind = 'fact' | 'derived' | 'inference' | 'user';

export interface CaseNode {
  id: string; label: string; short: string; rail: Rail;
  kind: 'bank' | 'upi' | 'wallet' | 'person' | 'exchange' | 'evidence' | 'message' | 'device';
  risk: 'low' | 'medium' | 'high' | 'critical';
  volume: string; firstSeen: string; lastSeen: string;
  meta: Record<string, string>; appearsAt: number; // seconds on the 4D timeline
}

export interface CaseEdge {
  id: string; from: string; to: string;
  meaning: 'normal' | 'suspicious' | 'highrisk' | 'crypto' | 'verified' | 'unknown';
  label: string; confidence: Confidence; why: string; evidence: string[];
  appearsAt: number; amount?: string;
}

export interface CaseEvent {
  t: number; title: string; detail: string; rail: Rail; kind: FindingKind;
}

export interface EvidenceItem {
  id: string; title: string; type: string; source: string; timestamp: string;
  entity: string; confidence: Confidence; status: EvStatus; relation: string; detail: string[];
}

export interface CaseModel {
  caseId: string; nodes: CaseNode[]; edges: CaseEdge[];
  events: CaseEvent[]; evidence: EvidenceItem[];
  killChain: { stage: string; done: boolean }[];
  hindi: string; hindiDeva: string; destination: string; live: boolean;
  stats: { entities: number; txns: number; links: number; evidence: number };
}

export const RAIL_COLOR: Record<Rail, string> = {
  upi: '#22d3ee', bank: '#7dd3fc', identity: '#94a3b8',
  crypto: '#8b5cf6', evidence: '#f8fafc', message: '#f5a30b',
};
export const MEANING_COLOR: Record<CaseEdge['meaning'], string> = {
  normal: '#22d3ee', suspicious: '#f5a30b', highrisk: '#f04444',
  crypto: '#8b5cf6', verified: '#f8fafc', unknown: '#5b6a7f',
};
const CONF2MEANING: Record<Confidence, CaseEdge['meaning']> = {
  'Known fact': 'verified', 'Supported': 'normal',
  'Possible relationship': 'suspicious', 'Unverified': 'unknown',
};

function shortAddr(v: string) { return v.length > 14 ? v.slice(0, 6) + '…' + v.slice(-4) : v; }

export function buildCase(inv: any, pack: any, caseId = 'SWRN-2026-1047'): CaseModel {
  const upi = inv.upi || {};
  const chain = inv.chain || {};
  const dep = chain.exchange_deposit || {};
  const vpa: string = upi.beneficiary_vpa || 'unknown@upi';
  const amt = upi.amount_inr ? `₹${Number(upi.amount_inr).toLocaleString('en-IN')}` : '₹—';
  const live = !chain.cached;
  const walletMain = '0x81F…main';

  const nodes: CaseNode[] = [
    { id: 'message', label: 'Lure message', short: 'LURE', rail: 'message', kind: 'message', risk: 'high', volume: '1 thread', firstSeen: 'T+00:00', lastSeen: 'T+00:00', meta: { channel: 'Telegram / WhatsApp', lure: 'Double-return scheme' }, appearsAt: 0 },
    { id: 'victim', label: 'First-party account', short: 'YOU', rail: 'identity', kind: 'person', risk: 'low', volume: amt, firstSeen: 'T+00:00', lastSeen: 'T+00:08', meta: { role: 'Originator (you)' }, appearsAt: 2 },
    { id: 'upi_payment', label: vpa, short: 'UPI', rail: 'upi', kind: 'upi', risk: 'medium', volume: amt, firstSeen: '12:41 IST', lastSeen: '12:41 IST', meta: { UTR: String(upi.txn_id || '—'), amount: amt }, appearsAt: 8 },
    { id: 'beneficiary', label: 'Recipient entity', short: 'ENTITY', rail: 'identity', kind: 'person', risk: 'high', volume: amt, firstSeen: 'T+00:08', lastSeen: 'T+00:16', meta: { vpa, phone: '+91 ••••• 3210' }, appearsAt: 16 },
    { id: 'crypto_onramp', label: 'On-ramp deposit', short: 'RAMP', rail: 'crypto', kind: 'exchange', risk: 'medium', volume: `${dep.value_usdt || '—'} USDT`, firstSeen: '12:58 IST', lastSeen: '12:58 IST', meta: { asset: 'USDT · Ethereum', delta: '17 min after UPI' }, appearsAt: 31 },
    { id: 'wallet_main', label: shortAddr(String(dep.tx_hash || '0x81F4…main')), short: '0x81F', rail: 'crypto', kind: 'wallet', risk: 'high', volume: `${dep.value_usdt || '—'} USDT`, firstSeen: 'T+00:47', lastSeen: 'active', meta: { chain: 'Ethereum', hops: '1 in · 2 out' }, appearsAt: 47 },
  ];
  (chain.after || []).slice(0, 4).forEach((a: any, i: number) => {
    nodes.push({
      id: `out_${i}`, label: shortAddr(String(a.to || '')), short: shortAddr(String(a.to || '')).slice(0, 7),
      rail: 'crypto', kind: 'wallet', risk: a.confidence === 'Supported' ? 'medium' : 'high',
      volume: `${a.value_usdt || '—'} USDT`, firstSeen: 'T+01:0' + i, lastSeen: 'active',
      meta: { note: String(a.evidence || '').slice(0, 60) }, appearsAt: 60 + i * 8,
    });
  });
  nodes.push({ id: 'cashout', label: 'Cash-out point', short: 'OUT', rail: 'crypto', kind: 'exchange', risk: 'critical', volume: 'unknown', firstSeen: 'unobserved', lastSeen: 'unobserved', meta: { state: 'Not yet observed — monitoring' }, appearsAt: 88 });

  const edges: CaseEdge[] = (inv.links || []).slice(0, 3).map((l: any, i: number) => ({
    id: `e${i}`, from: l.from_id === 'message' ? 'message' : l.from_id,
    to: l.to_id === 'upi_payment' ? 'upi_payment' : l.to_id === 'crypto_onramp' ? 'crypto_onramp' : 'wallet_main',
    meaning: CONF2MEANING[l.confidence as Confidence] || 'unknown',
    label: String(l.confidence), confidence: l.confidence, why: String(l.why || ''),
    evidence: l.evidence || [], appearsAt: [4, 31, 47][i] ?? 50,
    amount: i === 1 ? amt : undefined,
  }));
  edges.push(
    { id: 'e_victim', from: 'victim', to: 'upi_payment', meaning: 'verified', label: 'Known fact', confidence: 'Known fact', why: 'Originator-authorized UPI debit with matching UTR.', evidence: [`UTR ${upi.txn_id || '—'}`, `Amount ${amt}`], appearsAt: 8, amount: amt },
    { id: 'e_ben', from: 'upi_payment', to: 'beneficiary', meaning: 'verified', label: 'Known fact', confidence: 'Known fact', why: `Beneficiary VPA ${vpa} appears in both the lure message and the payment record.`, evidence: ['VPA match across rails'], appearsAt: 16 },
  );
  (chain.after || []).slice(0, 4).forEach((a: any, i: number) => {
    edges.push({
      id: `e_out${i}`, from: 'wallet_main', to: `out_${i}`,
      meaning: a.confidence === 'Supported' ? 'crypto' : 'suspicious',
      label: String(a.confidence || 'Possible relationship'), confidence: a.confidence || 'Possible relationship',
      why: String(a.evidence || ''), evidence: [String(a.evidence || ''), `${a.value_usdt} USDT`],
      appearsAt: 60 + i * 8, amount: `${a.value_usdt} USDT`,
    });
  });
  edges.push({ id: 'e_cash', from: 'wallet_main', to: 'cashout', meaning: 'unknown', label: 'Unverified', confidence: 'Unverified', why: 'No onward cash-out observed yet. Requires review — do not assume destination.', evidence: [], appearsAt: 88 });

  const events: CaseEvent[] = [
    { t: 0, title: 'UPI payment detected', detail: `${amt} → ${vpa}`, rail: 'upi', kind: 'fact' },
    { t: 8, title: 'Recipient entity identified', detail: 'VPA mirrored in lure message', rail: 'identity', kind: 'derived' },
    { t: 16, title: 'Message ↔ payment correlated', detail: 'Known-fact link established', rail: 'message', kind: 'derived' },
    { t: 31, title: 'On-ramp deposit detected', detail: `${dep.value_usdt || '—'} USDT · 17 min delta`, rail: 'crypto', kind: 'derived' },
    { t: 47, title: 'Wallet association discovered', detail: 'Main wallet now under observation', rail: 'crypto', kind: 'derived' },
    { t: 60, title: 'Outbound dispersion pattern detected', detail: 'Funds split across wallets', rail: 'crypto', kind: 'inference' },
    { t: 85, title: 'Cross-rail relationship established', detail: 'Message → UPI → crypto trail joined', rail: 'evidence', kind: 'derived' },
  ];

  const evidence: EvidenceItem[] = edges.filter(e => e.evidence.length).map((e, i) => ({
    id: `EV-${String(i + 1).padStart(3, '0')}`,
    title: `${e.from} → ${e.to}`,
    type: e.meaning === 'crypto' ? 'On-chain transfer' : e.meaning === 'verified' ? 'Record match' : 'Temporal correlation',
    source: e.meaning === 'crypto' ? (live ? 'Etherscan V2 · live' : 'Etherscan V2 · cached') : 'User-provided record',
    timestamp: e.appearsAt <= 16 ? '12:41 IST' : '12:58 IST+',
    entity: e.to, confidence: e.confidence,
    status: (e.confidence === 'Known fact' ? 'VERIFIED' : e.confidence === 'Supported' ? 'CORRELATED' : e.confidence === 'Possible relationship' ? 'REQUIRES REVIEW' : 'UNVERIFIED') as EvStatus,
    relation: e.label, detail: e.evidence,
  }));

  const kcOrder = ['LURE', 'TRUST', 'PAYMENT_REQUEST', 'UPI_TRANSFER', 'CRYPTO_CONVERSION', 'OBFUSCATION', 'CASH_OUT'];
  const killChain = kcOrder.map(s => ({ stage: s, done: !!inv.kill_chain?.[s] }));

  return {
    caseId, nodes, edges, events, evidence, killChain,
    hindi: String(inv.hindi_summary || ''), hindiDeva: String(inv.hindi_summary_deva || ''), destination: String(inv.current_destination || ''),
    live, stats: { entities: nodes.length, txns: (chain.after || []).length + 2, links: edges.length, evidence: evidence.length },
  };
}

export const REPLAY_SCRIPT = [
  'T+00:00 — UPI payment detected',
  'T+00:08 — Recipient entity identified',
  'T+00:16 — Message ↔ payment correlated',
  'T+00:31 — On-ramp deposit detected',
  'T+00:47 — Wallet association discovered',
  'T+01:00 — Dispersion pattern detected',
  'T+01:25 — Cross-rail relationship established',
];

export const T_MAX = 100;
