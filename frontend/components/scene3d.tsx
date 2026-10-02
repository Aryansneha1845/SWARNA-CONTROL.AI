'use client';
/* 4D INVESTIGATION SPACE — R3F scene. X = entities, Y = rail lane, Z = depth, TIME = replay scrub.
   Packets = animated money flow. Respects prefers-reduced-motion. */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import type { CaseModel, CaseNode, Rail } from '../lib/model';
import { MEANING_COLOR } from '../lib/model';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

type V3 = [number, number, number];
const LANE_Y: Record<Rail, number> = { message: 2.4, identity: 1.3, upi: 0.4, bank: 0.4, crypto: -0.8, evidence: -1.8 };

export function layoutNodes(nodes: CaseNode[]): Record<string, V3> {
  const pos: Record<string, V3> = {};
  const n = nodes.length;
  nodes.forEach((nd, i) => {
    const x = (i - (n - 1) / 2) * 3.1;
    let z = 0;
    if (nd.id.startsWith('out_')) z = -3.2;
    if (nd.id === 'cashout') z = -6;
    if (nd.kind === 'person') z = 1.6;
    pos[nd.id] = [x, (LANE_Y[nd.rail] ?? 0) + ((i % 2) ? 0.25 : -0.15), z];
  });
  return pos;
}

function NodeMesh({ node, pos, selected, dimmed, onSelect }: {
  node: CaseNode; pos: V3; selected: boolean; dimmed: boolean; onSelect: (id: string) => void;
}) {
  const core = useRef<THREE.Mesh>(null);
  const rm = useMemo(reducedMotion, []);
  const hot = node.risk === 'high' || node.risk === 'critical';
  useFrame(({ clock }) => {
    if (!core.current || rm || !hot) return;
    const s = 1 + 0.12 * Math.sin(clock.elapsedTime * 2.6);
    core.current.scale.setScalar(s);
  });
  const color = node.rail === 'crypto' ? '#8b5cf6' : node.rail === 'upi' ? '#22d3ee'
    : node.rail === 'message' ? '#f5a30b' : node.risk === 'critical' ? '#f04444' : '#cbd5e1';
  const op = dimmed ? 0.18 : 1;
  const geom =
    node.kind === 'wallet' ? <octahedronGeometry args={[0.55]} /> :
    node.kind === 'person' ? <sphereGeometry args={[0.5, 24, 24]} /> :
    node.kind === 'bank' ? <cylinderGeometry args={[0.55, 0.55, 0.5, 6]} /> :
    node.kind === 'message' ? <tetrahedronGeometry args={[0.62]} /> :
    <boxGeometry args={node.kind === 'exchange' ? [0.9, 0.9, 0.9] : [0.72, 0.72, 0.72]} />;
  return (
    <group position={pos}>
      <mesh
        onClick={e => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        {geom}
        <meshStandardMaterial color={color} transparent opacity={op} roughness={0.35} metalness={0.7}
          emissive={hot ? '#f04444' : color} emissiveIntensity={hot ? 0.55 : selected ? 0.5 : 0.18} />
      </mesh>
      {hot && (
        <mesh ref={core}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#f04444" transparent opacity={op} />
        </mesh>
      )}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.03, 12, 48]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      )}
      <Html center distanceFactor={14} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.08em',
          color: dimmed ? '#5b6a7f' : '#e8eef6', background: 'rgba(4,7,12,.72)',
          border: `1px solid ${dimmed ? '#1a2433' : color}55`, padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap',
        }}>{node.short}</div>
      </Html>
    </group>
  );
}

function FlowPacket({ from, to, color, active, fast }: {
  from: V3; to: V3; color: string; active: boolean; fast: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random());
  const rm = useMemo(reducedMotion, []);
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  useFrame((_, dt) => {
    if (!ref.current || !active || rm) return;
    t.current = (t.current + dt * (fast ? 0.55 : 0.28)) % 1;
    ref.current.position.lerpVectors(a, b, t.current);
  });
  if (!active) return null;
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (
    <mesh ref={ref} position={rm ? mid : undefined}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Rig({ entered, focus }: { entered: boolean; focus: V3 | null }) {
  const { camera, controls } = useThree() as any;
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const want = entered ? new THREE.Vector3(0, 2.2, 15.5) : new THREE.Vector3(0, 11, 30);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, want.x, 1.6, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, want.y, 1.6, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, want.z, 1.6, dt);
    if (controls) {
      target.set(...(focus ?? [0, 0.6, -1]));
      controls.target.x = THREE.MathUtils.damp(controls.target.x, target.x, 3, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, target.y, 3, dt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, target.z, 3, dt);
      controls.update();
    }
  });
  return null;
}

export function InvestigationScene({ caseData, time, selectedId, onSelect, railFilter, entered }: {
  caseData: CaseModel; time: number; selectedId: string | null;
  onSelect: (id: string | null) => void; railFilter: Rail | 'ALL'; entered: boolean;
}) {
  const pos = useMemo(() => layoutNodes(caseData.nodes), [caseData]);
  const focus = selectedId && pos[selectedId] ? pos[selectedId] : null;
  const visEdges = caseData.edges.filter(e => time >= e.appearsAt - 0.01);
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 11, 30], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 18, 46]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} />
      <pointLight position={[-8, 4, -4]} intensity={0.5} color="#8b5cf6" />
      <gridHelper args={[60, 60, '#16202f', '#0d141f']} position={[0, -2.6, 0]} />
      <Rig entered={entered} focus={focus} />
      {caseData.nodes.filter(n => time >= n.appearsAt).map(n => (
        <NodeMesh key={n.id} node={n} pos={pos[n.id]}
          selected={selectedId === n.id}
          dimmed={railFilter !== 'ALL' && n.rail !== railFilter && n.rail !== 'evidence'}
          onSelect={onSelect} />
      ))}
      {visEdges.map(e => {
        const dim = railFilter !== 'ALL' && !(['upi_payment', 'beneficiary', 'victim'].includes(e.from) || ['upi_payment', 'beneficiary', 'victim'].includes(e.to)) && railFilter !== 'crypto' && railFilter !== 'message';
        const col = MEANING_COLOR[e.meaning];
        return (
          <group key={e.id}>
            <Line points={[pos[e.from], pos[e.to]]} color={col} lineWidth={e.meaning === 'highrisk' ? 2.5 : 1.4}
              transparent opacity={dim || railFilter !== 'ALL' && false ? 0.15 : 0.85}
              dashed={e.meaning === 'unknown'} dashSize={0.35} gapSize={0.25} />
            <FlowPacket from={pos[e.from]} to={pos[e.to]} color={col}
              active={!(railFilter !== 'ALL' && dim)} fast={e.meaning === 'highrisk' || e.meaning === 'suspicious'} />
          </group>
        );
      })}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={5} maxDistance={42} maxPolarAngle={Math.PI / 1.75} />
    </Canvas>
  );
}

/* Cinematic ambient network for the hero landing */
function AmbientRig({ pts, lines }: { pts: V3[]; lines: V3[][] }) {
  const group = useRef<THREE.Group>(null);
  const rm = useMemo(reducedMotion, []);
  useFrame((_, dt) => { if (group.current && !rm) group.current.rotation.y += dt * 0.03; });
  return (
    <group ref={group}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color={i % 5 === 0 ? '#f5a30b' : i % 3 === 0 ? '#8b5cf6' : '#22d3ee'} transparent opacity={0.75} />
        </mesh>
      ))}
      {lines.map((l, i) => (
        <Line key={i} points={l} color="#1d3a4d" lineWidth={1} transparent opacity={0.5} />
      ))}
    </group>
  );
}

export function AmbientNet() {
  const { pts, lines } = useMemo(() => {
    const N = 42, pts: V3[] = [];
    for (let i = 0; i < N; i++) {
      const r = 9 + Math.random() * 9, a = Math.random() * Math.PI * 2;
      pts.push([Math.cos(a) * r, (Math.random() - 0.5) * 9, Math.sin(a) * r - 4]);
    }
    const lines: V3[][] = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < 6.5) lines.push([pts[i], pts[j]]);
    }
    return { pts, lines: lines.slice(0, 70) };
  }, []);
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 3, 24], fov: 55 }} gl={{ antialias: true }}>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 20, 50]} />
      <ambientLight intensity={0.7} />
      <AmbientRig pts={pts} lines={lines} />
    </Canvas>
  );
}
