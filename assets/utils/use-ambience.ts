/**
 * useAmbience — play a looping calming bed while `enabled`, stop otherwise.
 *
 * Generalizes the old pranayama "ocean during long holds" logic into a reusable
 * hook: hand it an asset (a require()'d sound, or null for "none") and a boolean,
 * and it owns the looping Audio.Sound lifecycle — start, stop, swap, and unmount
 * cleanup — with a cancellation guard for the async load.
 */
import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

export function useAmbience(asset: number | null | undefined, enabled: boolean): void {
  const soundRef = useRef<Audio.Sound | null>(null);

  const stop = () => {
    if (soundRef.current) {
      const s = soundRef.current;
      soundRef.current = null;
      s.stopAsync().catch(() => {});
      s.unloadAsync().catch(() => {});
    }
  };

  useEffect(() => {
    if (!enabled || asset == null) {
      stop();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(asset, { isLooping: true });
        if (cancelled) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        await sound.playAsync();
      } catch {
        // load failed — degrade silently; the rest of the timer is unaffected
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [asset, enabled]);

  // Belt-and-suspenders cleanup so a bed never outlives the screen.
  useEffect(() => stop, []);
}
