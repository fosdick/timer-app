import { Audio } from "expo-av";
import { AppState } from "react-native";

/* eslint-disable @typescript-eslint/no-var-requires */

// ─── Audio session ───────────────────────────────────────────────────────────
// iOS deactivates the audio session on interruptions (incoming phone calls) and
// when the app is backgrounded. If we never re-activate it, the timer keeps
// counting but goes SILENT until the app is restarted. So we (re)arm the session
// at startup AND every time the app returns to the foreground.
export async function armAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      interruptionModeIOS: 2,
    });
  } catch {
    // best-effort — never let an audio-mode hiccup crash a play call
  }
}

armAudioSession();
AppState.addEventListener("change", (state) => {
  if (state === "active") armAudioSession();
});

// ─── One-shot playback ───────────────────────────────────────────────────────
// Load → play → UNLOAD on finish. Without the unload, every chime leaked an
// Audio.Sound; a long pranayama session (a snap every couple of seconds) could
// spawn hundreds and eventually choke the audio system into silence.
async function playOneShot(
  source: Parameters<typeof Audio.Sound.createAsync>[0],
): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(source);
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
