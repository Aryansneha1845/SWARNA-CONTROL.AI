'use client';
/* 2D fallback: the same case model rendered as a clean ReactFlow graph.
   Used automatically when WebGL is unavailable, and on small screens. */
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import type { CaseModel, Rail } from '../lib/model';
import { MEANING_COLOR, RAIL_COLOR } from '../lib/model';

export default function Graph2D({ caseData, time, selectedId, onSelect, railFilter }: {
  caseData: CaseModel; time: number; selectedId: string | null;
  onSelect: (id: string | null) => void; railFilter: Rail | 'ALL';
}) {
  const vis = caseData.nodes.filter(n => time >= n.appearsAt && (railFilter === 'ALL' || n.rail === railFilter || n.rail === 'evidence'));
  const ids = new Set(vis.map(n => n.id));
  const nodes = vis.map((n, i) => ({
    id: n.id,
    position: { x: (i - (vis.length - 1) / 2) * 190, y: n.rail === 'crypto' ? 170 : n.rail === 'message' ? -140 : 0 },
    data: { label: `${n.short} · ${n.volume}` },
    style: {
      background: '#0b1018', color: '#e8eef6', border: `2px solid ${RAIL_COLOR[n.rail]}`,
      borderRadius: n.kind === 'wallet' ? 4 : 12, padding: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      boxShadow: selectedId === n.id ? `0 0 18px ${RAIL_COLOR[n.rail]}88` : (n.risk === 'high' || n.risk === 'critical') ? '0 0 14px #f0444455' : '0 4px 18px #000',
      opacity: 1,
    },
    selected: selectedId === n.id,
  }));
  const edges = caseData.edges
    .filter(e => ids.has(e.from) && ids.has(e.to) && time >= e.appearsAt)
    .map((e, i) => ({
      id: e.id || `e${i}`, source: e.from, target: e.to, label: e.label,
      animated: e.meaning === 'suspicious' || e.meaning === 'highrisk' || e.meaning === 'crypto',
      style: { stroke: MEANING_COLOR[e.meaning], strokeWidth: e.meaning === 'highrisk' ? 3 : 1.6 },
      labelStyle: { fill: '#93a1b5', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' },
    }));
  return (
    <ReactFlow nodes={nodes} edges={edges} fitView
      onNodeClick={(_, n) => onSelect(n.id)} onPaneClick={() => onSelect(null)}>
      <Background color="#131b28" gap={28} />
      <Controls />
    </ReactFlow>
  );
}
