import { useChamber } from '../store';
import { SPECIES } from '../data/speciesProfiles';
import { SpotlightCard } from './bits';

export default function SpeciesCatalog() {
  const { species, setSpecies } = useChamber();
  return (
    <div className="species-grid">
      {SPECIES.map((s) => (
        <button key={s.key} className={`species ${s.key === species.key ? 'sel' : ''}`} onClick={() => setSpecies(s.key)} aria-pressed={s.key === species.key}>
          <SpotlightCard color={`${s.color}33`}>
            <span className="chip" style={{ background: s.color, color: '#0B0E0C' }}>{s.kind}</span>
            <h3><em>{s.name}</em></h3>
            <p className="muted small">{s.common}</p>
            <dl className="mono">
              <div><dt>Day</dt><dd>{s.dayTemp}°C · {s.dayRh}%</dd></div>
              <div><dt>Night</dt><dd>{s.nightTemp}°C · {s.nightRh}%</dd></div>
              <div><dt>VPD</dt><dd>{s.vpd} kPa</dd></div>
            </dl>
          </SpotlightCard>
        </button>
      ))}
    </div>
  );
}
