import { useRef, useState } from 'react';
import { useChamber } from '../store';
import { profileAt } from '../engine/stratification';
import { BAND_COLOR, vpdBand } from '../engine/psychrometrics';

const tempColor = (t: number) => {
  const k = Math.min(1, Math.max(0, (t - 8) / 20));
  return `hsl(${200 - k * 190}, 85%, ${45 + k * 8}%)`;
};

export default function ChamberStage() {
  const { layers, env, leafOffset, species } = useChamber();
  const box = useRef<HTMLDivElement>(null);
  const [probes, setProbes] = useState([{ id: 1, y: 0.2 }, { id: 2, y: 0.8 }]);
  const drag = useRef<number | null>(null);

  const move = (e: React.PointerEvent) => {
    if (drag.current === null) return;
    const r = box.current!.getBoundingClientRect();
    const y = Math.min(0.97, Math.max(0.03, (e.clientY - r.top) / r.height));
    setProbes((p) => p.map((q) => (q.id === drag.current ? { ...q, y } : q)));
  };

  const grad = `linear-gradient(to bottom, ${layers.map((l, i) => `${tempColor(l.temp)} ${[0, 50, 100][i]}%`).join(', ')})`;

  return (
    <div>
      <div className="stage" ref={box} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
        <div className="stage-heat" style={{ background: grad }} />
        <div className="stage-lamp" style={{ opacity: 0.2 + env.light * 0.8, boxShadow: `0 8px 60px ${20 + env.light * 60}px rgba(255,200,120,${0.1 + env.light * 0.4})` }} />
        {env.events.fogger && <div className="fog" />}
        {env.events.rain && <div className="rain" />}
        <div className="mist"><i /><i /><i /></div>
        <div className="strata">
          <span style={{ top: '0%' }}>Canopy</span>
          <span style={{ top: '25%' }}>Epiphyte zone</span>
          <span style={{ top: '75%' }}>Substrate · LECA</span>
        </div>
        <div className="fan-arrows" style={{ opacity: env.fan / 100 }}>{'↓ '.repeat(3)}</div>
        {probes.map((p) => {
          const l = profileAt(env, p.y, leafOffset);
          return (
            <div key={p.id} className="probe" style={{ top: `${p.y * 100}%` }}
              onPointerDown={(e) => { drag.current = p.id; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}>
              <b style={{ background: BAND_COLOR[vpdBand(l.vpd)] }} />
              <span className="mono">{l.temp.toFixed(1)}° · {l.rh.toFixed(0)}% · {l.vpd.toFixed(2)}kPa</span>
            </div>
          );
        })}
      </div>
      <ul className="layers">
        {layers.map((l) => (
          <li key={l.id}>
            <span className="label">{l.label}</span>
            <span className="mono">{l.temp.toFixed(1)}°C · {l.rh.toFixed(0)}% · {l.ppfd.toFixed(0)} PPFD</span>
          </li>
        ))}
      </ul>
      <p className="muted small">Drag the probes to read the gradient at any depth. Target for {species.name}: {species.vpd} kPa.</p>
    </div>
  );
}
