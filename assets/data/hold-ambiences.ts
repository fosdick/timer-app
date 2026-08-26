/**
 * Hold ambiences — the looping sound beds that play during pranayama long holds
 * (Antara/Bahya Kumbhaka). Curated and rendered in Sound Lab (seamless loops,
 * loudness-tuned), then synced into assets/sounds.
 *
 * React Native's `require()` needs STATIC paths (resolved by the bundler at
 * build time), so the assets live in this fixed map and are selected by id.
 * To add a bed: render+sync it in Sound Lab, drop a new entry here.
 */
export interface HoldAmbience {
  id: string;
  label: string;
  /** require()'d audio module, or null for "None" (silent hold). */
  asset: number | null;
}

export const HOLD_AMBIENCES: HoldAmbience[] = [
  { id: "ocean", label: "Ocean", asset: require("../sounds/ocean.wav") },
  { id: "fire", label: "Fire", asset: require("../sounds/fire-loop.wav") },
  { id: "wind", label: "Wind", asset: require("../sounds/wind-loop.wav") },
  { id: "waves", label: "Waves", asset: require("../sounds/waves-on-boat-quieter-loop.wav") },
  { id: "none", label: "None", asset: null },
];

export const DEFAULT_HOLD_AMBIENCE = "ocean";

export const getAmbience = (id: string | undefined): HoldAmbience =>
  HOLD_AMBIENCES.find((a) => a.id === id) ?? HOLD_AMBIENCES[0];
