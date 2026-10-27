import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { SPECIES, speciesByKey, Species } from './data/speciesProfiles';
import { ambientAt } from './engine/diurnal';
import { layerProfiles } from './engine/stratification';
import { vpd, dewPoint } from './engine/psychrometrics';

interface Chamber {
  species: Species;
  setSpecies: (k: string) => void;
  hour: number;
  setHour: (h: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  leafOffset: number;
  setLeafOffset: (v: number) => void;
  env: ReturnType<typeof ambientAt>;
  layers: ReturnType<typeof layerProfiles>;
  mean: { temp: number; rh: number; vpd: number; dew: number };
}

const Ctx = createContext<Chamber | null>(null);
export const useChamber = () => useContext(Ctx)!;

export function ChamberProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(SPECIES[0].key);
  const [hour, setHour] = useState(() => new Date().getHours() + new Date().getMinutes() / 60);
  const [playing, setPlaying] = useState(false);
  const [leafOffset, setLeafOffset] = useState(-0.5);
  const species = speciesByKey(key);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setHour((h) => (h + 0.1) % 24), 100);
    return () => clearInterval(id);
  }, [playing]);

  const value = useMemo<Chamber>(() => {
    const env = ambientAt(hour, species);
    const layers = layerProfiles(env, leafOffset);
    return {
      species, setSpecies: setKey, hour, setHour, playing, setPlaying, leafOffset, setLeafOffset, env, layers,
      mean: { temp: env.temp, rh: env.rh, vpd: vpd(env.temp, env.rh, leafOffset), dew: dewPoint(env.temp, env.rh) },
    };
  }, [species, hour, playing, leafOffset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const fmtHour = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};
