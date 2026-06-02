/**
 * Yoga Paces
 *
 * A "Pace" is a saved bundle of yoga-timer settings:
 *   - Main timer duration (initialTotalTime, seconds)
 *   - Main transition pause + sound
 *   - Half mark pause + sound + enabled toggle
 *
 * Persistence model:
 *   - Paces themselves are stored as a JSON array at PACES_KEY.
 *   - The currently-loaded pace id is stored at ACTIVE_PACE_ID_KEY so the
 *     yoga screen can restore it on launch. Cleared when the active pace
 *     is deleted (or set to null explicitly).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TransitionSoundId,
  HalfMarkSoundId,
} from "@/components/timer-settings-panel";

const PACES_KEY = "yoga_paces";
const ACTIVE_PACE_ID_KEY = "yoga_active_pace_id";

export interface TimerPace {
  id: string;
  name: string;
  initialTotalTime: number; // seconds
  transitionPauseMs: number;
  transitionSound: TransitionSoundId;
  halfMarkPauseMs: number;
  halfMarkSound: HalfMarkSoundId;
  halfMarkEnabled: boolean;
  createdAt: number; // ms epoch
}

export type TimerPaceInput = Omit<TimerPace, "id" | "createdAt">;

/**
 * The settings the app ships with — what a user sees on first install,
 * and what "Restore defaults" reverts to. Kept here so the Pace list and
 * the yoga view stay in agreement about what "default" means.
 *
 * NOTE: These values should match the defaults at the top of yoga-view.tsx
 * (DEFAULT_INITIAL_TOTAL_TIME, DEFAULT_TRANSITION_PAUSE_MS, DEFAULT_HALF_MARK_PAUSE_MS)
 * and the initial useState values for the sounds + toggle.
 */
export const DEFAULT_PACE_SETTINGS: Omit<TimerPaceInput, "name"> = {
  initialTotalTime: 30,
  transitionPauseMs: 5000,
  transitionSound: "swoosh",
  halfMarkPauseMs: 1000,
  halfMarkSound: "sticks",
  halfMarkEnabled: true,
};

// Simple time-based id, no UUID dep needed
const generateId = (): string =>
  `pace_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// ─── Pace CRUD ───────────────────────────────────────────────────────────────

export const loadPaces = async (): Promise<TimerPace[]> => {
  try {
    const raw = await AsyncStorage.getItem(PACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TimerPace[]) : [];
  } catch {
    return [];
  }
};

const persistPaces = async (paces: TimerPace[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PACES_KEY, JSON.stringify(paces));
  } catch {
    // ignore
  }
};

export const addPace = async (input: TimerPaceInput): Promise<TimerPace> => {
  const newPace: TimerPace = {
    ...input,
    id: generateId(),
    createdAt: Date.now(),
  };
  const paces = await loadPaces();
  // Newest first — matches "show most recent at top" expectations
  const next = [newPace, ...paces];
  await persistPaces(next);
  return newPace;
};

export const updatePace = async (
  id: string,
  input: TimerPaceInput,
): Promise<TimerPace | null> => {
  const paces = await loadPaces();
  const idx = paces.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: TimerPace = {
    ...paces[idx],
    ...input,
    id,
    createdAt: paces[idx].createdAt,
  };
  const next = [...paces];
  next[idx] = updated;
  await persistPaces(next);
  return updated;
};

export const deletePace = async (id: string): Promise<void> => {
  const paces = await loadPaces();
  await persistPaces(paces.filter((p) => p.id !== id));
};

export const getPaceById = (
  paces: TimerPace[],
  id: string | null | undefined,
): TimerPace | undefined => {
  if (!id) return undefined;
  return paces.find((p) => p.id === id);
};

// ─── Active pace tracking ────────────────────────────────────────────────────

export const loadActivePaceId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACTIVE_PACE_ID_KEY);
  } catch {
    return null;
  }
};

export const saveActivePaceId = async (id: string | null): Promise<void> => {
  try {
    if (id === null) {
      await AsyncStorage.removeItem(ACTIVE_PACE_ID_KEY);
    } else {
      await AsyncStorage.setItem(ACTIVE_PACE_ID_KEY, id);
    }
  } catch {
    // ignore
  }
};

// ─── Formatting helpers ──────────────────────────────────────────────────────

/**
 * Compact summary like "50s · 7.0s/3.0s" or "5:00 · 5.0s/off".
 * Shown under the pace name in the pace list.
 */
export const formatPaceSummary = (pace: TimerPace): string => {
  const timer =
    pace.initialTotalTime < 60
      ? `${pace.initialTotalTime}s`
      : `${Math.floor(pace.initialTotalTime / 60)}:${String(
          pace.initialTotalTime % 60,
        ).padStart(2, "0")}`;
  const transition = `${(pace.transitionPauseMs / 1000).toFixed(1)}s`;
  const halfMark = pace.halfMarkEnabled
    ? `${(pace.halfMarkPauseMs / 1000).toFixed(1)}s`
    : "off";
  return `${timer} · ${transition}/${halfMark}`;
};
