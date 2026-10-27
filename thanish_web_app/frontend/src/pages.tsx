import { FormEvent, useEffect, useState } from 'react';
import { fmtHour, useChamber } from './store';
import { SpotlightCard } from './components/bits';
import TelemetryCard from './components/TelemetryCard';
import ChamberStage from './components/ChamberStage';
import VpdHeatmap from './components/VpdHeatmap';
import RelayRack from './components/RelayRack';
import DiurnalScheduler from './components/DiurnalScheduler';
import SpeciesCatalog from './components/SpeciesCatalog';

const Panel = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <SpotlightCard className={`panel ${className}`}><h2>{title}</h2>{children}</SpotlightCard>
);

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { fetch(url).then((r) => r.json()).then(setData).catch(() => setErr(true)); }, [url]);
  return { data, err };
}

export function Chamber() {
  const { species, mean, hour } = useChamber();
  const [wx, setWx] = useState<{ temp_c: number; rh: number; source: string } | null>(null);
  useEffect(() => { fetch('/api/weather/').then((r) => r.json()).then(setWx).catch(() => setWx(null)); }, []);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Chamber Alpha · Highland Tepui Biome</p>
        <h1 className="page-title">Microclimate, measured in kPa.</h1>
        <p className="lede">Simulating {species.name} at {fmtHour(hour)}: {mean.temp.toFixed(1)}°C, {mean.rh.toFixed(0)}% RH, VPD {mean.vpd.toFixed(2)} kPa.
          {wx && <> Outside: {wx.temp_c}°C / {wx.rh}% <span className="muted">({wx.source === 'open-meteo' ? 'live' : 'fallback data'})</span>.</>}</p>
      </section>
      <TelemetryCard />
      <div className="grid2">
        <Panel title="Vertical stratification"><ChamberStage /></Panel>
        <div className="stack">
          <Panel title="VPD psychrometric matrix"><VpdHeatmap /></Panel>
          <Panel title="Hardware relays"><RelayRack /></Panel>
        </div>
      </div>
    </>
  );
}

export const Schedule = () => (
  <>
    <h1 className="page-title">24-hour diurnal program</h1>
    <Panel title="Dawn → noon → dusk → night chill"><DiurnalScheduler /></Panel>
    <div className="grid2"><Panel title="Relay state now"><RelayRack /></Panel><Panel title="Live readout"><TelemetryCard /></Panel></div>
  </>
);

export const Species = () => (
  <>
    <h1 className="page-title">Species catalog</h1>
    <p className="lede">Select a species: its survival envelope is outlined on the heatmap and drives the whole simulation.</p>
    <SpeciesCatalog />
    <Panel title="Envelope on the VPD matrix"><VpdHeatmap /></Panel>
  </>
);

interface FaqRow { id: number; category: string; question: string; answer: string }
export function Faq() {
  const { data, err } = useApi<{ faqs: FaqRow[] }>('/api/faqs/');
  const [open, setOpen] = useState<number | null>(null);
  const cats = [...new Set(data?.faqs.map((f) => f.category))];
  return (
    <>
      <h1 className="page-title">Frequently asked questions</h1>
      {err && <p className="muted">Could not load FAQs.</p>}
      {!data && !err && <p className="muted">Loading…</p>}
      {cats.map((c) => (
        <section key={c}>
          <h2 className="cat">{c}</h2>
          {data!.faqs.filter((f) => f.category === c).map((f) => (
            <div key={f.id} className={`faq glass ${open === f.id ? 'open' : ''}`}>
              <button onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id}>{f.question}<span>{open === f.id ? '−' : '+'}</span></button>
              {open === f.id && <p>{f.answer}</p>}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

export function Errors() {
  const { data, err } = useApi<{ errors: { code: string; title: string; meaning: string; fix: string }[] }>('/api/errors/');
  return (
    <>
      <h1 className="page-title">Error codes</h1>
      <p className="lede">Every status the site and API can return. Ask the assistant about any of them.</p>
      {err && <p className="muted">Could not load error codes.</p>}
      <div className="grid3">
        {data?.errors.map((e) => (
          <SpotlightCard key={e.code} className="errcard">
            <span className="mono code">{e.code}</span><h3>{e.title}</h3>
            <p>{e.meaning}</p><p className="muted small"><b>Fix:</b> {e.fix}</p>
          </SpotlightCard>
        ))}
      </div>
    </>
  );
}

export function Status() {
  const [h, setH] = useState<{ status: string; uptime_s: number; checks: Record<string, string> } | null>(null);
  const [down, setDown] = useState(false);
  useEffect(() => {
    const load = () => fetch('/health/').then((r) => r.json()).then((d) => { setH(d); setDown(false); }).catch(() => setDown(true));
    load(); const id = setInterval(load, 10000); return () => clearInterval(id);
  }, []);
  return (
    <>
      <h1 className="page-title">System status</h1>
      <Panel title="Health check">
        {down && <p>Cannot reach the server (503).</p>}
        {h && (<>
          <p><span className="dot" style={{ background: h.status === 'ok' ? '#10B981' : '#EF4444' }} /> <b>{h.status}</b> · uptime {h.uptime_s}s</p>
          <ul className="layers">{Object.entries(h.checks).map(([k, v]) => <li key={k}><span className="label">{k}</span><span className="mono">{v}</span></li>)}</ul>
          <p className="muted small">Raw JSON: <a href="/health/">/health/</a></p>
        </>)}
      </Panel>
    </>
  );
}

export function Support() {
  const [msg, setMsg] = useState(''); const [email, setEmail] = useState(''); const [done, setDone] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/ticket/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, email, source: 'form' }) });
    const d = await r.json();
    setDone(r.ok ? `Ticket #${d.ticket_id} created.` : d.error?.message ?? 'Failed.');
    if (r.ok) setMsg('');
  };
  return (
    <>
      <h1 className="page-title">Contact support</h1>
      <Panel title="Open a ticket">
        <form className="ticket-form" onSubmit={submit}>
          <label className="label" htmlFor="em">Email (optional)</label>
          <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="label" htmlFor="ms">How can we help?</label>
          <textarea id="ms" required rows={5} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button className="btn" type="submit">Submit ticket</button>
          {done && <p role="status">{done}</p>}
        </form>
      </Panel>
    </>
  );
}
