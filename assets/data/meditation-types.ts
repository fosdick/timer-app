/**
 * Meditation types.
 *
 * A type is HOW you sit, not how long. Silent is bells and nothing else; a
 * chanted type plays a recording you meditate to.
 *
 * Chanted is deliberately modelled as AUDIO, not as a counter. Counting japa is
 * what a mala is for — someone with beads in their hand does not need an app to
 * tally 108. What an app can offer is the chant itself, so the user listens
 * rather than counts.
 *
 * Only Silent ships in the first pass. The shape is here so a recording drops in
 * without reworking the screen: add the entry, add the asset, done.
 */
export type MeditationTypeId = "silent" | "om-namah-shivaya";

export interface MeditationType {
  id: MeditationTypeId;
  label: string;
  /** One line, shown under the picker. */
  blurb: string;
  /**
   * Bundled audio for a chanted type. When present the recording IS the session,
   * so its length sets the duration and the duration picker steps aside.
   */
  track?: { module: number; approxSec: number };
  available: boolean;
}

export const MEDITATION_TYPES: MeditationType[] = [
  {
    id: "silent",
    label: "Silent",
    blurb: "Bells mark the time. Nothing else.",
    available: true,
  },
  {
    id: "om-namah-shivaya",
    label: "Om Namah Shivaya",
    blurb: "Sit with the chant — 108 repetitions.",
    // No `track` yet: the recording is Jarvis's own voice, still to be made in
    // ../sound-lab. Listed but not selectable, so the shape stays visible.
    available: false,
  },
];

export const DEFAULT_MEDITATION_TYPE: MeditationTypeId = "silent";

export const meditationType = (id: MeditationTypeId): MeditationType =>
  MEDITATION_TYPES.find((t) => t.id === id) ?? MEDITATION_TYPES[0];

/** Session lengths offered as presets, in seconds. */
export const MEDITATION_PRESETS = [300, 600, 900, 1200, 1800] as const;

export const presetLabel = (sec: number): string => `${Math.round(sec / 60)} min`;
