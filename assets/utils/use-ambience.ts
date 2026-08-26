/**
 * useAmbience — play a looping calming bed while `enabled`, stop otherwise.
 *
 * Seamless looping is done with TWO players of the same asset crossfaded at
 * every joint (equal-power, OVERLAP_SEC), because expo-av's `isLooping` wraps
 * by seeking back to zero on iOS's AVPlayer — an audible ~tens-of-ms dropout
 * at every loop. The crossfade is the app-side version of Sound Lab's
 * seamless-loop technique, masks JS timer jitter inside the overlap, and adds
 * the gentle session fade-in for free. No native dependencies.
 */
import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

const OVERLAP_SEC = 1.0; // crossfade window at each loop joint
const START_FADE_SEC = 1.0; // gentle fade-in when the session starts
const FADE_STEPS = 12;

type Timer = ReturnType<typeof setTimeout>;

export function useAmbience(asset: number | null | undefined, enabled: boolean): void {
  // Guards the async startup against a stop that lands mid-load.
  const runRef = useRef(0);

  useEffect(() => {
    if (!enabled || asset == null) return;
    const run = ++runRef.current;
    const live = () => runRef.current === run;
    const timers = new Set<Timer>();
    const sounds: Audio.Sound[] = [];

    const after = (sec: number, fn: () => void) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (live()) fn();
      }, sec * 1000);
      timers.add(t);
    };

    // Equal-power volume ramps, stepped on JS timers (expo-av's only knob).
    const fadeIn = (s: Audio.Sound, sec: number) => {
      for (let i = 1; i <= FADE_STEPS; i++) {
        const v = Math.sin(((i / FADE_STEPS) * Math.PI) / 2);
        after((sec * i) / FADE_STEPS, () => s.setVolumeAsync(v).catch(() => {}));
      }
    };
    const fadeOut = (s: Audio.Sound, sec: number) => {
      for (let i = 1; i <= FADE_STEPS; i++) {
        const v = Math.cos(((i / FADE_STEPS) * Math.PI) / 2);
        after((sec * i) / FADE_STEPS, () => s.setVolumeAsync(v).catch(() => {}));
      }
    };

    (async () => {
      try {
        const [a, b] = await Promise.all([
          Audio.Sound.createAsync(asset, { volume: 0 }),
          Audio.Sound.createAsync(asset, { volume: 0 }),
        ]);
        sounds.push(a.sound, b.sound);
        if (!live()) {
          // Stopped while loading — cleanup already ran, so unload here.
          sounds.forEach((s) => s.unloadAsync().catch(() => {}));
          return;
        }

        const durSec = a.status.isLoaded && a.status.durationMillis ? a.status.durationMillis / 1000 : 0;
        if (durSec < OVERLAP_SEC * 3) {
          // Too short to crossfade meaningfully — fall back to native looping.
          await a.sound.setIsLoopingAsync(true);
          await a.sound.setVolumeAsync(1);
          await a.sound.playAsync();
          return;
        }

        const players = [a.sound, b.sound];
        const playFrom = async (idx: number, fadeSec: number) => {
          const s = players[idx];
          try {
            await s.setPositionAsync(0);
            await s.setVolumeAsync(0);
            await s.playAsync();
          } catch {
            return; // degrade silently; the timer chain ends here
          }
          if (!live()) return;
          fadeIn(s, fadeSec);
          // Hand off to the other player just before this one runs out.
          after(durSec - OVERLAP_SEC, () => {
            playFrom(1 - idx, OVERLAP_SEC).catch(() => {});
            fadeOut(s, OVERLAP_SEC);
            after(OVERLAP_SEC + 0.1, () => s.stopAsync().catch(() => {}));
          });
        };
        await playFrom(0, START_FADE_SEC);
      } catch {
        // load failed — degrade silently; the rest of the timer is unaffected
      }
    })();

    return () => {
      runRef.current++; // invalidates `live()` for all pending timers/loads
      timers.forEach(clearTimeout);
      sounds.forEach((s) => {
        s.stopAsync().catch(() => {});
        s.unloadAsync().catch(() => {});
      });
    };
  }, [asset, enabled]);
}
