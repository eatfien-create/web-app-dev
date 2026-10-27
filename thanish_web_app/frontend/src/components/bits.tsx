import { useMemo, useRef, ReactNode, MouseEvent, CSSProperties } from 'react';

/** Outlined card with a faint rust spotlight that follows the pointer. */
export function SpotlightCard({ children, className = '', color = 'rgba(139,46,26,.10)' }: { children: ReactNode; className?: string; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={move} className={`glass spot ${className}`} style={{ '--spot': color } as CSSProperties}>
      {children}
    </div>
  );
}

// small deterministic PRNG so the contours are identical on every render
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function ring(cx: number, cy: number, r: number, wobble: number, rand: () => number, phase: number) {
  const n = 28;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r + wobble * (Math.sin(a * 3 + phase) * 0.6 + Math.sin(a * 5 + phase * 2) * 0.3 + (rand() - 0.5) * 0.25);
    return [cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr] as const;
  });
  // Catmull-Rom → cubic Bézier closed path
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Topographic contour artwork, echoing the reference's map-line hero. */
export function Topo({ className = '', seed = 7 }: { className?: string; seed?: number }) {
  const paths = useMemo(() => {
    const rand = rng(seed * 977);
    const clusters = [
      { cx: 330, cy: 250, rings: 16, r0: 14, dr: 15, w: 1 },
      { cx: 150, cy: 120, rings: 7, r0: 10, dr: 14, w: 0.8 },
      { cx: 430, cy: 470, rings: 9, r0: 12, dr: 15, w: 0.9 },
    ];
    return clusters.flatMap((c, ci) =>
      Array.from({ length: c.rings }, (_, k) => ({
        d: ring(c.cx, c.cy, c.r0 + k * c.dr, (4 + k * 1.6) * c.w, rand, ci * 2 + k * 0.17),
        dash: k % 4 === 3,
      })),
    );
  }, [seed]);
  return (
    <svg className={`topo ${className}`} viewBox="0 0 560 600" aria-hidden preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        {paths.map((p, i) => <path key={i} d={p.d} strokeDasharray={p.dash ? '6 3 1.5 3' : undefined} opacity={0.55 + (i % 5) * 0.09} />)}
      </g>
      {[[470, 120], [520, 350], [250, 560]].map(([x, y]) => (
        <g key={x} stroke="currentColor" strokeWidth="1.4"><path d={`M${x - 9},${y}H${x + 9}M${x},${y - 9}V${y + 9}`} /></g>
      ))}
    </svg>
  );
}
