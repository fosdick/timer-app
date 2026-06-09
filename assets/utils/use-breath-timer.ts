/**
 * useBreathTimer — the React glue around the tested breath-timer core.
 *
 * Deliberately thin: all the decision logic lives in breath-timer-core.ts
 * (unit-tested). This hook only owns the ticker, wall-clock elapsed tracking
 * (so it never drifts with setInterval jitter), and firing the click callback.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BreathPattern, buildTimeline, cycleDurationSec } from "../data/breath-patterns";
import { breathView, clicksBetween, BreathClick, BreathView } from "../data/breath-timer-core";

const TICK_MS = 100;

export interface UseBreathTimerOptions {
  clickSlotSec?: number;
  countDurationSec?: number;
  onClick?: (click: BreathClick) => void;
  onFinish?: () => void;
}

export interface BreathTimer {
  view: BreathView;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useBreathTimer(
  pattern: BreathPattern,
  totalDurationSec: number,
  opts: UseBreathTimerOptions = {},
): BreathTimer {
  const { clickSlotSec = 0, countDurationSec = 1, onClick, onFinish } = opts;

  const timeline = useMemo(
    () => buildTimeline(pattern, { clickSlotSec, countDurationSec }),
    [pattern, clickSlotSec, countDurationSec],
  );
  const cycleDur = useMemo(
    () => cycleDurationSec(pattern, { clickSlotSec, countDurationSec }),
    [pattern, clickSlotSec, countDurationSec],
  );

  const [isRunning, setIsRunning] = useState(false);
  const [view, setView] = useState<BreathView>(() =>
    breathView(0, timeline, cycleDur, totalDurationSec, countDurationSec),
  );

  // Mutable state read by the (stable) ticker — avoids stale closures.
  const accumulatedRef = useRef(0); // elapsed seconds before the current run segment
  const runStartedAtRef = useRef(0); // Date.now() at the start of the current run
  const prevElapsedRef = useRef(0); // last processed elapsed (for click windows)
  const runningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timelineRef = useRef(timeline);
  const cycleDurRef = useRef(cycleDur);
  const totalRef = useRef(totalDurationSec);
  const countDurRef = useRef(countDurationSec);
  const onClickRef = useRef(onClick);
  const onFinishRef = useRef(onFinish);
  timelineRef.current = timeline;
  cycleDurRef.current = cycleDur;
  totalRef.current = totalDurationSec;
  countDurRef.current = countDurationSec;
  onClickRef.current = onClick;
  onFinishRef.current = onFinish;

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    accumulatedRef.current += (Date.now() - runStartedAtRef.current) / 1000;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    runningRef.current = false;
    setIsRunning(false);
  }, []);

  const tick = useCallback(() => {
    const elapsed = accumulatedRef.current + (Date.now() - runStartedAtRef.current) / 1000;
    const clicks = clicksBetween(prevElapsedRef.current, elapsed, timelineRef.current, cycleDurRef.current);
    for (const c of clicks) onClickRef.current?.(c);
    prevElapsedRef.current = elapsed;
    const v = breathView(elapsed, timelineRef.current, cycleDurRef.current, totalRef.current, countDurRef.current);
    setView(v);
    if (v.finished) {
      stop();
      onFinishRef.current?.();
    }
  }, [stop]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    if (accumulatedRef.current >= totalRef.current) accumulatedRef.current = 0; // fresh run after finishing
    runStartedAtRef.current = Date.now();
    prevElapsedRef.current = accumulatedRef.current;
    runningRef.current = true;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const reset = useCallback(() => {
    stop();
    accumulatedRef.current = 0;
    prevElapsedRef.current = 0;
    setView(breathView(0, timelineRef.current, cycleDurRef.current, totalRef.current, countDurRef.current));
  }, [stop]);

  // When the pattern/total changes while stopped, refresh the displayed view.
  useEffect(() => {
    if (!runningRef.current) {
      setView(breathView(accumulatedRef.current, timeline, cycleDur, totalDurationSec, countDurationSec));
    }
  }, [timeline, cycleDur, totalDurationSec, countDurationSec]);

  // Clean up the ticker on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { view, isRunning, start, stop, reset };
}
