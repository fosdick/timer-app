/**
 * Sound option catalogs for the breath timer: the boundary click sounds, and the
 * calming ambience beds (rendered as seamless, loudness-tuned loops in Sound
 * Lab). Both are simple id→data lists so the picker UI and persistence stay
 * trivial. RN's require() needs STATIC paths, hence the fixed map.
 */
import { playAsset } from "@/assets/utils/sounds";

export interface ClickSound {
  id: string;
  label: string;
  play: () => void;
}

// require() needs static literal paths. Each sound has a base variant and a
// "-db" (downbeat-shaped) variant; both Click and Downbeat wheels offer all six.
const oneShot = (asset: number) => () => playAsset(asset);

export const CLICK_SOUNDS: ClickSound[] = [
  { id: "snap", label: "Snap", play: oneShot(require("../../assets/sounds/snap.wav")) },
  { id: "sticks", label: "Sticks", play: oneShot(require("../../assets/sounds/sticks.wav")) },
  { id: "bell", label: "Bell", play: oneShot(require("../../assets/sounds/bell.wav")) },
  { id: "snap-db", label: "Snap DB", play: oneShot(require("../../assets/sounds/snap-db.wav")) },
  { id: "sticks-db", label: "Sticks DB", play: oneShot(require("../../assets/sounds/sticks-db.wav")) },
  { id: "bell-db", label: "Bell DB", play: oneShot(require("../../assets/sounds/bell-db.wav")) },
  { id: "none", label: "None", play: () => {} },
];

export const DEFAULT_CLICK_ID = "snap";

// Downbeat = the per-count pulse during a phase. Defaults to the snap's
// downbeat-shaped variant; the user can pick any of the six in the wheel.
export const DEFAULT_DOWNBEAT_ID = "snap-db";

export const getClickSound = (id: string | undefined): ClickSound =>
  CLICK_SOUNDS.find((c) => c.id === id) ?? CLICK_SOUNDS[0];

export interface Ambience {
  id: string;
  label: string;
  /** require()'d audio module, or null for "None" (silence). */
  asset: number | null;
}

// The Sound Lab ambience set (2026-06 renders). Same ids as the old hold-
// ambience beds where the sound carried over, so persisted picks keep working.
export const AMBIENCES: Ambience[] = [
  { id: "none", label: "None", asset: null },
  { id: "ocean", label: "Ocean", asset: require("../../assets/sounds/853970-reflektwave-meditative-oc.wav") },
  { id: "waves", label: "Waves", asset: require("../../assets/sounds/waves-on-boat-loop.wav") },
  { id: "sailboat", label: "Sailboat", asset: require("../../assets/sounds/851577-myloop-ammersee-sailboat-.wav") },
  { id: "wind", label: "Wind", asset: require("../../assets/sounds/772520-klankbeeld-wind-bushes-90.wav") },
  { id: "fire", label: "Fire", asset: require("../../assets/sounds/852107-myloop-fireplace.wav") },
  { id: "nature", label: "Nature", asset: require("../../assets/sounds/150842-setcookie-tiru-nature-tak.wav") },
];

export const DEFAULT_AMBIENCE_ID = "none";

export const getAmbience = (id: string | undefined): Ambience =>
  AMBIENCES.find((a) => a.id === id) ?? AMBIENCES[0];
