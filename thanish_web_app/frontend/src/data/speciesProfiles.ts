export interface Species {
  key: string;
  name: string;
  common: string;
  kind: 'Carnivorous plant' | 'Dart frog' | 'Orchid';
  dayTemp: number;
  nightTemp: number;
  dayRh: number;
  nightRh: number;
  vpd: number;
  /** target canopy PPFD, µmol·m⁻²·s⁻¹ */
  ppfd: number;
  color: string;
}

export const SPECIES: Species[] = [
  { key: 'nepenthes_villosa', name: 'Nepenthes villosa', common: 'Highland pitcher plant', kind: 'Carnivorous plant', dayTemp: 20, nightTemp: 10, dayRh: 70, nightRh: 98, vpd: 0.45, ppfd: 280, color: '#10B981' },
  { key: 'ranitomeya_variabilis', name: 'Ranitomeya variabilis', common: 'Variable poison dart frog', kind: 'Dart frog', dayTemp: 24, nightTemp: 19, dayRh: 80, nightRh: 95, vpd: 0.5, ppfd: 120, color: '#38BDF8' },
  { key: 'lepanthes_calodictyon', name: 'Lepanthes calodictyon', common: 'Jewel orchid', kind: 'Orchid', dayTemp: 22, nightTemp: 15, dayRh: 85, nightRh: 95, vpd: 0.35, ppfd: 100, color: '#818CF8' },
  { key: 'heliamphora_minor', name: 'Heliamphora minor', common: 'Tepui sun pitcher', kind: 'Carnivorous plant', dayTemp: 25, nightTemp: 12, dayRh: 60, nightRh: 99, vpd: 0.6, ppfd: 350, color: '#F59E0B' },
];

export const speciesByKey = (k: string) => SPECIES.find((s) => s.key === k) ?? SPECIES[0];
