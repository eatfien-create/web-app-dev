import { useChamber } from '../store';
import { BAND_COLOR, BAND_LABEL, vpdBand } from '../engine/psychrometrics';
import { dailyLightIntegral } from '../engine/diurnal';
import { SpotlightCard } from './bits';

export default function TelemetryCard() {
  const { mean, species, env } = useChamber();
  const band = vpdBand(mean.vpd);
  const dliVal = dailyLightIntegral(species.ppfd);
  const dewing = mean.temp <= mean.dew + 0.3;
  const items = [
    { k: 'Air temp', v: mean.temp.toFixed(1), u: '°C', c: '#B45309' },
    { k: 'Humidity', v: mean.rh.toFixed(0), u: '% RH', c: '#0369A1' },
    { k: 'VPD', v: mean.vpd.toFixed(2), u: 'kPa', c: '#8B2E1A' },
    { k: 'Dew point', v: mean.dew.toFixed(1), u: '°C', c: '#4F46E5' },
    { k: 'PPFD', v: env.ppfd.toFixed(0), u: 'µmol', c: '#333' },
    { k: 'DLI', v: dliVal.toFixed(1), u: 'mol/day', c: '#333' },
  ];
  return (
    <SpotlightCard className="telemetry">
      <div className="tele-grid">
        {items.map((i) => (
          <div key={i.k} className="tele">
            <span className="label">{i.k}</span>
            <span className="mono big" style={{ color: i.c }}>{i.v}<small>{i.u}</small></span>
          </div>
        ))}
      </div>
      <p className="status">
        <span className={`dot ${dewing ? 'pulse' : ''}`} style={{ background: BAND_COLOR[band] }} />
        {BAND_LABEL[band]}{dewing ? ' · at dew point, surfaces are condensing' : ''}
      </p>
    </SpotlightCard>
  );
}
