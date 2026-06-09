/**
 * Sound option catalogs for the breath timer: the boundary click sounds, and the
 * calming ambience beds (reused from the hold-ambience set). Both are simple
 * id→data lists so the picker UI and persistence stay trivial.
 */
import { playSnap, playBeat, playStart } from "@/assets/utils/sounds";
import { HOLD_AMBIENCES, getAmbience } from "@/assets/data/hold-ambiences";

export interface ClickSound {
  id: string;
  label: string;
  play: () => void;
}

export const CLICK_SOUNDS: ClickSound[] = [
  { id: "snap", label: "Snap", play: playSnap },
  { id: "sticks", label: "Sticks", play: playBeat },
  { id: "bell", label: "Bell", play: playStart },
  { id: "none", label: "None", play: () => {} },
];

export const DEFAULT_CLICK_ID = "snap";

export const getClickSound = (id: string | undefined): ClickSound =>
  CLICK_SOUNDS.find((c) => c.id === id) ?? CLICK_SOUNDS[0];

// Ambience beds — reuse the curated hold-ambience set (Ocean/Fire/Wind/Waves/None).
export const AMBIENCES = HOLD_AMBIENCES;
export { getAmbience };
export const DEFAULT_AMBIENCE_ID = "none";
