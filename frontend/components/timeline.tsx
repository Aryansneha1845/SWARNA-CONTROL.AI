'use client';
/* TEMPORAL INVESTIGATION TIMELINE — the 4th dimension: play / reverse / speed / scrub / jump-to-event. */
import { T_MAX, type CaseEvent } from '../lib/model';

export default function Timeline({ time, setTime, playing, setPlaying, dir, setDir, speed, setSpeed, events, onReplay, replaying }: {
  time: number; setTime: (t: number) => void;
  playing: boolean; setPlaying: (b: boolean) => void;
  dir: 1 | -1; setDir: (d: 1 | -1) => void;
  speed: number; setSpeed: (s: number) => void;
  events: CaseEvent[]; onReplay: () => void; replaying: boolean;
}) {
  const fmt = (t: number) => `T+${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const active = events.filter(e => e.t <= time).length;
  return (
    <div className="cc-timeline">
      <button className="tl-btn" title="Reverse" onClick={() => { setDir(-1); setPlaying(true); }} style={dir === -1 && playing ? { borderColor: '#22d3ee', color: '#22d3ee' } : {}}>◀◀</button>
      <button className="tl-btn primary" title={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
      <button className="tl-btn" title="Forward" onClick={() => { setDir(1); setPlaying(true); }}>▶▶</button>
      <div className="tl-track">
        <input type="range" className="tl-slider" min={0} max={T_MAX} step={0.5} value={time}
          onChange={e => { setTime(Number(e.target.value)); }} />
        <div style={{ position: 'relative', height: 10 }}>
          {events.map((e, i) => (
            <button key={i} title={`${fmt(e.t)} — ${e.title}`} onClick={() => setTime(e.t)}
              style={{ position: 'absolute', left: `${(e.t / T_MAX) * 100}%`, top: 0, width: 8, height: 8, borderRadius: '50%',
                border: 0, padding: 0, background: e.t <= time ? '#f5a30b' : '#2a3a52', transform: 'translateX(-50%)' }} />
          ))}
        </div>
        <div className="tl-scale"><span>09-01</span><span>09-05</span><span>09-10</span><span>09-15</span><span>09-20</span></div>
      </div>
      <div className="tl-meta"><b>{fmt(time)}</b> · {active}/{events.length} EVENTS</div>
      {[0.5, 1, 2].map(s => (
        <button key={s} className="rail-btn" style={speed === s ? { color: '#f5a30b', borderColor: '#f5a30b' } : {}} onClick={() => setSpeed(s)}>×{s}</button>
      ))}
      <button className="btn" style={replaying ? { borderColor: '#f5a30b', color: '#f5a30b' } : {}} onClick={onReplay}>↻ REPLAY INVESTIGATION</button>
    </div>
  );
}
