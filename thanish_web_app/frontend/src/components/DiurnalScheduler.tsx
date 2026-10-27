import { fmtHour, useChamber } from '../store';
import { ambientAt, dailyLightIntegral, kelvin, lightFraction } from '../engine/diurnal';

const W = 720, H = 180;

export default function DiurnalScheduler() {
  const { hour, setHour, playing, setPlaying, species } = useChamber();
  const pts = Array.from({ length: 97 }, (_, i) => i / 4);
  const x = (h: number) => (h / 24) * W;
  const light = pts.map((h) => `${x(h)},${H - 20 - lightFraction(h) * (H - 50)}`).join(' ');
  const temp = pts.map((h) => {
    const t = ambientAt(h, species).temp;
    return `${x(h)},${H - 20 - ((t - 5) / 25) * (H - 50)}`;
  }).join(' ');
  const k = kelvin(hour);
  const night = hour < 6 || hour >= 22;
  const dliVal = dailyLightIntegral(species.ppfd);

  return (
    <div>
      <div className="timeline-head">
        <button className="btn" onClick={() => setPlaying(!playing)}>{playing ? '❚❚ Pause' : '▶ Play day'}</button>
        <span className="mono big">{fmtHour(hour)}</span>
        <span className="chip" style={{ background: night ? '#818CF8' : `hsl(${20 + (k - 2700) / 80}, 90%, 65%)`, color: '#0B0E0C' }}>
          {night ? '450nm moonlight' : `${Math.round(k)}K`}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="timeline" role="img" aria-label="24-hour light and temperature curves">
        <defs>
          <linearGradient id="sky" x1="0" x2="1">
            <stop offset="0" stopColor="#818CF8" stopOpacity=".25" /><stop offset=".25" stopColor="#F59E0B" stopOpacity=".25" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".12" /><stop offset=".75" stopColor="#F59E0B" stopOpacity=".25" />
            <stop offset="1" stopColor="#818CF8" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#sky)" rx="10" />
        <rect x={x(22)} y="0" width={W - x(22)} height={H} fill="#818CF8" opacity=".12" />
        <rect x="0" y="0" width={x(4)} height={H} fill="#818CF8" opacity=".12" />
        {[7, 17].map((h) => <line key={h} x1={x(h)} x2={x(h)} y1="10" y2={H - 20} stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />)}
        <polyline points={light} fill="none" stroke="#F59E0B" strokeWidth="2.5" />
        <polyline points={temp} fill="none" stroke="#00E599" strokeWidth="2" strokeDasharray="5 4" />
        {[0, 6, 12, 18, 22].map((h) => <text key={h} x={x(h) + 4} y={H - 5} className="axis">{String(h).padStart(2, '0')}:00</text>)}
        <line x1={x(hour)} x2={x(hour)} y1="0" y2={H - 20} stroke="#333" strokeWidth="2" />
      </svg>
      <input className="scrub" type="range" min={0} max={23.99} step={0.05} value={hour} onChange={(e) => { setPlaying(false); setHour(+e.target.value); }} aria-label="Time of day" />
      <div className="legend">
        <span><i style={{ background: '#F59E0B' }} />light</span>
        <span><i style={{ background: '#00E599' }} />air temp</span>
        <span><i style={{ background: '#38BDF8' }} />rain bursts 07:00 · 17:00</span>
        <span><i style={{ background: '#818CF8' }} />fog 22:00–04:00</span>
      </div>
      <p className="muted">
        Daily Light Integral for {species.name}: <b className="mono">{dliVal.toFixed(1)} mol·m⁻²·day⁻¹</b>
        {' '}— {dliVal < 12 ? 'low for pitcher pigmentation' : dliVal > 35 ? 'high, risk of bleaching' : 'good for pitcher pigmentation'}.
      </p>
    </div>
  );
}
