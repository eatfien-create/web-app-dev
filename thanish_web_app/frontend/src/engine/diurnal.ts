import type { Species } from '../data/speciesProfiles';
import type { Ambient } from './stratification';

/** Light intensity 0..1 over a 24h day: dawn ramp 06→12 (30%→100%), dusk fall 12→22, moonlight at night. */
export function lightFraction(h: number): number {
  if (h >= 6 && h < 12) return 0.3 + 0.7 * smooth((h - 6) / 6);
  if (h >= 12 && h < 18) return 1 - 0.2 * smooth((h - 12) / 6);
  if (h >= 18 && h < 22) return 0.8 * (1 - smooth((h - 18) / 4));
  return 0.005;
}

export function kelvin(h: number): number {
  if (h < 6 || h >= 22) return 450; // indigo moonlight is 450nm, shown as a tint
  if (h < 12) return 3000 + 3500 * smooth((h - 6) / 6);
  if (h < 18) return 6500 - 3800 * smooth((h - 12) / 6);
  return 2700;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Events {
  rain: boolean;
  fogger: boolean;
  fanPurge: boolean;
}

export function eventsAt(h: number): Events {
  // 15 s rain bursts at 07:00 and 17:00; shown for the first 0.1 h so they are visible on the timeline
  const rain = [7, 17].some((s) => h >= s && h < s + 0.1);
  const afterRain = [7, 17].some((s) => h >= s + 0.1 && h < s + 0.1 + 10 / 60);
  return { rain, fogger: h >= 22 || h < 4, fanPurge: afterRain };
}

export function ambientAt(h: number, sp: Species): Ambient & { light: number; events: Events } {
  const light = lightFraction(h);
  const events = eventsAt(h);
  const t = smooth(Math.min(1, light / 0.8));
  let rh = lerp(sp.nightRh, sp.dayRh, t);
  if (events.fogger) rh = Math.max(rh, sp.nightRh);
  const fan = events.fanPurge ? 90 : 25 + 25 * light;
  return { temp: lerp(sp.nightTemp, sp.dayTemp, t), rh, ppfd: sp.ppfd * light, fan, light, events };
}

/** Hours of effective light at a given species PPFD: integrate the curve in 0.25 h steps. */
export function dailyLightIntegral(peakPpfd: number): number {
  let sum = 0;
  for (let h = 0; h < 24; h += 0.25) sum += peakPpfd * lightFraction(h) * 0.25 * 3600;
  return sum / 1e6;
}
