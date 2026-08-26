import { Audio } from "expo-av";
import { AppState } from "react-native";

/* eslint-disable @typescript-eslint/no-var-requires */

type SoundSource = Parameters<typeof Audio.Sound.createAsync>[0];

// One playback level for EVERY one-shot cue in the app (pranayama clicks &
// chimes, yoga transition / half-mark, HIIT start), so a sound is exactly as
// loud auditioned in a picker preview as it is in the running timer. This is
// the single knob the "preview ≠ running volume" fix turns: every path below
// loads through `loadCue`, so none can drift from the others.
export const CUE_VOLUME = 1.0;

// ─── Audio session ───────────────────────────────────────────────────────────
// iOS deactivates the audio session on interruptions (incoming phone calls) and
// when the app is backgrounded. If we never re-activate it, the timer keeps
// counting but goes SILENT until the app is restarted. So we (re)arm the session
// at startup AND every time the app returns to the foreground.
let _armed = false;
export async function armAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      interruptionModeIOS: 2,
    });
    _armed = true;
  } catch {
    // best-effort — never let an audio-mode hiccup crash a play call
  }
}

// Re-arm only when needed. During continuous foreground playback this is a
// no-op after the first arm (so it adds no per-cue latency to tightly-timed
// pranayama clicks); any interruption or backgrounding clears the flag, so the
// very next cue re-arms and playback never silently dies after a phone call.
async function ensureArmed(): Promise<void> {
  if (!_armed) await armAudioSession();
}

armAudioSession();
AppState.addEventListener("change", (state) => {
  if (state === "active") armAudioSession();
  else _armed = false; // session may be torn down while backgrounded/interrupted
});

// ─── Shared cue loader ───────────────────────────────────────────────────────
// The ONE place a one-shot cue is created. Every player (one-shot and
// stoppable) funnels through here, so audio-session handling and volume are
// identical across all tabs — that consistency is the whole point.
async function loadCue(source: SoundSource): Promise<Audio.Sound> {
  await ensureArmed();
  const { sound } = await Audio.Sound.createAsync(source, { volume: CUE_VOLUME });
  return sound;
}

// ─── One-shot playback ───────────────────────────────────────────────────────
// Load → play → UNLOAD on finish. Without the unload, every chime leaked an
// Audio.Sound; a long pranayama session (a snap every couple of seconds) could
// spawn hundreds and eventually choke the audio system into silence.
async function playOneShot(source: SoundSource): Promise<void> {
  try {
    const sound = await loadCue(source);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
    await sound.playAsync();
  } catch {
    // best-effort
  }
}

// Stoppable cue: same loader (so same session + volume as everything else), but
// it hands the caller the Sound so a long cue can be cut short — the yoga
// preview cancels on picker-close, and the yoga running player stops the
// previous cue before the next. Both call this, making preview and running the
// exact same code path.
export async function playStoppableCue(
  source: SoundSource,
  onReady: (sound: Audio.Sound) => void,
): Promise<void> {
  try {
    const sound = await loadCue(source);
    onReady(sound);
    await sound.playAsync();
  } catch {
    // best-effort
  }
}

// Generic one-shot for a require()'d asset module — lets the click/downbeat
// catalog (breath-sounds) own its own sound files without a function per sound.
export const playAsset = (asset: number) => { void playOneShot(asset); };

export const playBeat = () => { void playOneShot(require("../sounds/sticks-low-1.wav")); };
export const playHalfway = () => { void playOneShot(require("../sounds/sticks-low-1.wav")); };
export const playManualModeHalfwayChime = () => { void playOneShot(require("../sounds/sticks-low-1.wav")); };
export const playEndChime = () => { void playOneShot(require("../sounds/end-bell.wav")); };
export const playLevelComplete = () => { void playOneShot(require("../sounds/yay-ending.wav")); };
export const playSnap = () => { void playOneShot(require("../sounds/snap.wav")); };
export const playHittStart = () => { void playOneShot(require("../sounds/hitt-start.wav")); };
export const playStart = () => { void playOneShot(require("../sounds/350548__fairhavencollection__bell-hit.wav")); };
export const playYogaTransition = (): void => { void playOneShot(require("../sounds/733936__creator_gt__swoosh-04.wav")); };

/* eslint-enable @typescript-eslint/no-var-requires */
