import { useEffect, useRef, useState } from 'react';
import { useChamber } from '../store';
import { BAND_COLOR, vpd, vpdBand } from '../engine/psychrometrics';
import { SPECIES } from '../data/speciesProfiles';

const T0 = 10, T1 = 35, R0 = 30, R1 = 100;
const W = 560, H = 360, PAD = { l: 44, r: 12, t: 12, b: 34 };

export default function VpdHeatmap() {
  const { mean, leafOffset, setLeafOffset, species } = useChamber();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ t: number; rh: number } | null>(null);

  const px = (t: number) => PAD.l + ((t - T0) / (T1 - T0)) * (W - PAD.l - PAD.r);
  const py = (rh: number) => PAD.t + (1 - (rh - R0) / (R1 - R0)) * (H - PAD.t - PAD.b);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const cw = (W - PAD.l - PAD.r) / 100, ch = (H - PAD.t - PAD.b) / 70;
    for (let i = 0; i < 100; i++) for (let j = 0; j < 70; j++) {
      const t = T0 + ((i + 0.5) / 100) * (T1 - T0);
      const rh = R1 - ((j + 0.5) / 70) * (R1 - R0);
      const v = vpd(t, rh, leafOffset);
      ctx.fillStyle = BAND_COLOR[vpdBand(v)];
      ctx.globalAlpha = vpdBand(v) === 'ok' ? 0.22 : 0.5;
      ctx.fillRect(PAD.l + i * cw, PAD.t + j * ch, cw + 0.6, ch + 0.6);
    }
    ctx.globalAlpha = 1;
    // species survival envelopes
    SPECIES.forEach((s) => {
      const sel = s.key === species.key;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = sel ? 2.5 : 1;
      ctx.globalAlpha = sel ? 1 : 0.4;
      ctx.setLineDash(sel ? [] : [4, 4]);
      const x0 = px(Math.min(s.nightTemp, s.dayTemp) - 1), x1 = px(Math.max(s.nightTemp, s.dayTemp) + 1);
      const y0 = py(Math.max(s.dayRh, s.nightRh) + 3), y1 = py(Math.min(s.dayRh, s.nightRh) - 3);
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // axes
    ctx.fillStyle = '#333'; ctx.font = '11px "DM Mono", monospace';
    for (let t = 10; t <= 35; t += 5) ctx.fillText(`${t}°`, px(t) - 8, H - 14);
    for (let r = 30; r <= 100; r += 10) ctx.fillText(`${r}%`, 6, py(r) + 4);
    // live point
    const x = px(mean.temp), y = py(Math.min(R1, Math.max(R0, mean.rh)));
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fillStyle = 'rgba(51,51,51,0.22)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = '#333'; ctx.fill();
    ctx.strokeStyle = '#F7F5E8'; ctx.lineWidth = 1.5; ctx.stroke();
  }, [mean.temp, mean.rh, leafOffset, species]);

  const onMove = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    const t = T0 + ((x - PAD.l) / (W - PAD.l - PAD.r)) * (T1 - T0);
    const rh = R1 - ((y - PAD.t) / (H - PAD.t - PAD.b)) * (R1 - R0);
    setHover(t >= T0 && t <= T1 && rh >= R0 && rh <= R1 ? { t, rh } : null);
  };
  const hv = hover ? vpd(hover.t, hover.rh, leafOffset) : null;

  return (
    <div>
      <div className="canvas-wrap">
        <canvas ref={canvas} width={W} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-label="VPD psychrometric heatmap" />
        {hover && hv !== null && (
          <div className="tip mono">{hover.t.toFixed(1)}°C · {hover.rh.toFixed(0)}% → {hv.toFixed(2)} kPa</div>
        )}
      </div>
      <div className="legend">
        <span><i style={{ background: BAND_COLOR.stress }} />&gt;1.4 stress</span>
        <span><i style={{ background: BAND_COLOR.target }} />0.4–0.8 target</span>
        <span><i style={{ background: BAND_COLOR.risk }} />&lt;0.2 mold risk</span>
      </div>
      <label className="slider">
        <span className="label">Leaf offset <b className="mono">{leafOffset > 0 ? '+' : ''}{leafOffset.toFixed(1)}°C</b></span>
        <input type="range" min={-2} max={1} step={0.1} value={leafOffset} onChange={(e) => setLeafOffset(+e.target.value)} />
      </label>
    </div>
  );
}
