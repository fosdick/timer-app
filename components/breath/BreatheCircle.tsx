import { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { BreathView } from "@/assets/data/breath-timer-core";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

/**
 * A calm breath-synced ring behind the count — the "time moving forward like
 * music, not a progress bar" idea, and what fills the iPad's empty middle.
 * It expands over the inhale, holds while held, contracts over the exhale,
 * easing on the UI thread. Driven off the live phase (kind + segmentRemaining):
 * a new phase animates the scale toward its target over that phase's duration;
 * holds keep the current size. Decorative only (pointerEvents none).
 */
const CONTRACTED = 0.5;
const EXPANDED = 1;

export function BreatheCircle({
  view,
  running,
  size,
  metronome = false,
}: {
  view: BreathView;
  running: boolean;
  size: number;
  metronome?: boolean;
}) {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const scale = useRef(new Animated.Value(CONTRACTED)).current;
  const lastPhase = useRef<string>("");

  useEffect(() => {
    if (!running || metronome) {
      lastPhase.current = "";
      Animated.timing(scale, { toValue: 0.72, duration: 500, useNativeDriver: true }).start();
      return;
    }
    // Only retarget when the phase actually changes — let the running animation
    // play out across the many per-tick view updates within one phase.
    const phase = `${view.phaseIndex}:${view.kind}`;
    if (phase === lastPhase.current) return;
    lastPhase.current = phase;

    const target =
      view.kind === "inhale" ? EXPANDED : view.kind === "exhale" ? CONTRACTED : null;
    if (target === null) return; // holds: stay put (expanded after inhale, etc.)

    Animated.timing(scale, {
      toValue: target,
      duration: Math.max(200, view.segmentRemaining * 1000),
      useNativeDriver: true,
    }).start();
  }, [running, metronome, view.phaseIndex, view.kind, view.segmentRemaining, scale]);

  const tint = metronome ? t.accentSoft : t.phaseTint[view.kind] ?? t.accentSoft;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: tint, transform: [{ scale }] },
        ]}
      />
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  ring: { borderWidth: 2, opacity: 0.45 },
});
