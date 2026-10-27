import { dewPoint, vpd } from './psychrometrics';

export interface Layer {
  id: 'canopy' | 'mid' | 'substrate';
  label: string;
  /** vertical position, 0 = top of chamber, 1 = bottom */
  y: number;
  temp: number;
  rh: number;
  ppfd: number;
  vpd: number;
  dew: number;
}

export interface Ambient {
  temp: number; // mean air temp
  rh: number;
  ppfd: number; // at canopy
  fan: number; // 0-100
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Heat rises toward the lamp, cool humid air sinks. Fan airflow mixes the
 * layers and flattens the gradient.
 */
export function profileAt(a: Ambient, y: number, leafOffset = 0): Layer {
  const mix = 1 - 0.6 * (a.fan / 100); // 1 = full gradient
  const heat = a.ppfd / 300; // lamp strength
  const tTop = a.temp + (1.0 + 3.0 * heat) * mix;
  const tBot = a.temp - (1.5 + 2.0 * (1 - heat)) * mix;
  const temp = tTop + (tBot - tTop) * y;
  // moisture is conserved-ish: pick the vapor pressure from mean air, then recompute RH per layer
  const rh = clamp(a.rh + (y - 0.4) * 30 * mix, 20, 100);
  const ppfd = a.ppfd * Math.exp(-2.2 * y);
  return {
    id: y < 0.25 ? 'canopy' : y < 0.75 ? 'mid' : 'substrate',
    label: y < 0.25 ? 'Canopy' : y < 0.75 ? 'Mid-epiphyte' : 'Substrate',
    y,
    temp,
    rh,
    ppfd,
    vpd: vpd(temp, rh, leafOffset),
    dew: dewPoint(temp, rh),
  };
}

export const layerProfiles = (a: Ambient, leafOffset = 0): Layer[] =>
  [0.125, 0.5, 0.875].map((y) => profileAt(a, y, leafOffset));
