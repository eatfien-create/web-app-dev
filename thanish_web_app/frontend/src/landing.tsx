import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SPECIES } from './data/speciesProfiles';
import { Topo } from './components/bits';

const PROBLEMS = [
  ['01', 'Humidity means nothing alone', '80% RH at 30°C and 80% at 15°C are different worlds. We model vapor pressure deficit, the number a leaf or a frog\'s skin actually feels.'],
  ['02', 'Every tank has a landscape', 'Hot and dry under the lamp, cold and wet in the substrate. Drop probes at any depth and read the gradient.'],
  ['03', 'A day is a curve, not a switch', 'Dawn ramps, dusk glows, nights chill and fog. Plan the whole 24 hours before you touch real hardware.'],
];

interface Faq { id: number; question: string; answer: string; category: string }

export default function Landing() {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  useEffect(() => { fetch('/api/faqs/').then((r) => r.json()).then((d) => setFaqs(d.faqs.slice(0, 3))).catch(() => {}); }, []);

  const onScroll = () => {
    const t = track.current!;
    setIdx(Math.round(t.scrollLeft / (t.scrollWidth / SPECIES.length)));
  };
  const go = (d: number) => {
    const t = track.current!;
    t.scrollBy({ left: d * (t.scrollWidth / SPECIES.length), behavior: 'smooth' });
  };
  const drag = useRef<{ x: number; l: number } | null>(null);

  return (
    <>
      <section className="hero-l">
        <Topo className="hero-topo" />
        <h1>We grow climates that mean life.</h1>
        <p className="hero-sub">A microclimate studio for carnivorous plant growers, dart frog keepers and cloud forest terrarium builders.</p>
        <Link to="/chamber/" className="pill-btn">Open the chamber</Link>
        <a href="#about" className="round-btn" aria-label="Scroll down">↓</a>
      </section>

      <section id="about" className="statement">
        <h2>Every Chamber Has a Landscape. We Help You Shape It.</h2>
        <p>VivariaOS is a simulator and planner for sealed, living ecosystems. It models vapor pressure deficit, vertical stratification, and a full diurnal program, so the plants and animals you keep get the climate they evolved for. Grounded in psychrometric physics, shaped by craft, built to be trusted.</p>
        <Link to="/chamber/" className="pill-btn">See the simulator</Link>
      </section>

      <section className="concrete">
        <div className="problems">
          {PROBLEMS.map(([n, t, d]) => (
            <article key={n}><span className="num-s">{n}</span><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </section>

      <section className="work">
        <div className="work-head">
          <span className="counter">{String(idx + 1).padStart(2, '0')}<small>/{String(SPECIES.length).padStart(2, '0')}</small></span>
          <span className="eyebrow-l">Species we&rsquo;ve modelled</span>
          <span className="drag-hint">Drag ↔</span>
          <div className="arrows"><button onClick={() => go(-1)} aria-label="Previous">←</button><button onClick={() => go(1)} aria-label="Next">→</button></div>
        </div>
        <div className="track" ref={track} onScroll={onScroll}
          onPointerDown={(e) => { drag.current = { x: e.clientX, l: track.current!.scrollLeft }; }}
          onPointerMove={(e) => { if (drag.current && e.pointerType === 'mouse') track.current!.scrollLeft = drag.current.l - (e.clientX - drag.current.x); }}
          onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
          {SPECIES.map((s) => (
            <Link to="/species/" key={s.key} className="slide" draggable={false}>
              <div className="slide-art"><Topo seed={s.key.length} /><span className="chip-l" style={{ borderColor: s.color }}>{s.kind}</span></div>
              <h3>{s.name}</h3>
              <p>{s.common}. {s.dayTemp}°C by day, {s.nightTemp}°C at night, {s.nightRh}% night fog.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="insights">
        <div className="insights-head"><h2>Common Questions</h2><Link to="/faq/" className="link-caps">View all</Link></div>
        {faqs.map((f) => (
          <Link to="/faq/" key={f.id} className="insight">
            <span className="tag">{f.category}</span><h3>{f.question}</h3><span className="read">Read →</span>
          </Link>
        ))}
      </section>

      <section className="cta">
        <h2>Stuck on something?</h2>
        <p>Ask the assistant in the corner, or open a ticket and a person will follow up.</p>
        <Link to="/support/" className="pill-btn">Let&rsquo;s connect</Link>
      </section>
    </>
  );
}
