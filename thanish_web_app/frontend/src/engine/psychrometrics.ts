/** Saturation vapor pressure in kPa (Tetens). */
export const vpSat = (t: number) => 0.61078 * Math.exp((17.27 * t) / (t + 237.3));

/** VPD in kPa with leaf temperature = air + offset. */
export const vpd = (airC: number, rh: number, leafOffset = 0) =>
  vpSat(airC + leafOffset) - vpSat(airC) * (rh / 100);

/** Dew point in °C (Magnus inversion of Tetens). */
export const dewPoint = (airC: number, rh: number) => {
  const g = Math.log(Math.max(rh, 1) / 100) + (17.27 * airC) / (airC + 237.3);
  return (237.3 * g) / (17.27 - g);
};

/** Daily Light Integral, mol·m⁻²·day⁻¹. */
export const dli = (ppfd: number, hours: number) => ppfd * hours * 0.0036;

export type VpdBand = 'stress' | 'target' | 'risk' | 'ok';
export const vpdBand = (v: number): VpdBand =>
  v > 1.4 ? 'stress' : v < 0.2 ? 'risk' : v >= 0.4 && v <= 0.8 ? 'target' : 'ok';

export const BAND_COLOR: Record<VpdBand, string> = {
  stress: '#EF4444',
  target: '#10B981',
  risk: '#38BDF8',
  ok: '#F59E0B',
};

export const BAND_LABEL: Record<VpdBand, string> = {
  stress: 'Stomatal shutdown',
  target: 'Target transpiration',
  risk: 'Condensation / mold risk',
  ok: 'Acceptable',
};
