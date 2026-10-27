import { useChamber } from '../store';

export default function RelayRack() {
  const { env } = useChamber();
  const relays = [
    { icon: '💡', name: 'Sun LED', on: env.light > 0.01, val: `${Math.round(env.light * 100)}%` },
    { icon: '🌫️', name: 'Fogger', on: env.events.fogger, val: env.events.fogger ? 'ON' : 'IDLE' },
    { icon: '🚿', name: 'Rain nozzles', on: env.events.rain, val: env.events.rain ? 'BURST' : 'IDLE' },
    { icon: '💨', name: 'Fan', on: env.fan > 0, val: `${Math.round(env.fan)}%` },
  ];
  return (
    <div className="relays">
      {relays.map((r) => (
        <div key={r.name} className={`relay ${r.on ? 'on' : ''}`}>
          <span className="ico">{r.icon}</span>
          <span className="label">{r.name}</span>
          <b className="mono">{r.val}</b>
        </div>
      ))}
    </div>
  );
}
