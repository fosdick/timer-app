import { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BreathView } from "@/assets/data/breath-timer-core";
import { lotus } from "@/assets/data/lotus";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/** The flower is drawn in a -60..60 box so a 50-unit petal has room to breathe. */
const VIEW_BOX = "-60 -60 120 120";
const PETALS = lotus();

/**
 * A calm breath-synced lotus behind the count — the "time moving forward like
 * music, not a progress bar" idea, and what fills the iPad's empty middle.
 * It opens over the inhale, holds while held, closes over the exhale, easing on
 * the UI thread. Driven off the live phase (kind + segmentRemaining): a new phase
 * animates the scale toward its target over that phase's duration; holds keep the
 * current size. Decorative only (pointerEvents none).
 *
 * Ten petals, because Manipura — the third chakra, at the solar plexus — is drawn
 * with ten. This was a ring until 2026-08-29; the animation is unchanged, only the
 * shape swapped, so if the flower ever needs to go back it is one element.
 *
 * The geometry lives in assets/data/lotus.ts as pure functions and is parameterised
 * (outer / inner / width / waist) precisely so the LOOK can be iterated on without
 * touching this file.
 */
const CONTRACTED = 0.5;
const EXPANDED = 1;

export function BreatheLotus({
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
      <AnimatedSvg
        width={size}
        height={size}
        viewBox={VIEW_BOX}
        style={[styles.flower, { transform: [{ scale }] }]}
      >
        {PETALS.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            fill="none"
            stroke={tint}
            strokeWidth={2}
            // Each petal is the same path, just turned. Rotating rather than
            // baking ten paths keeps the geometry honest to the maths.
            transform={`rotate(${p.angle})`}
          />
        ))}
      </AnimatedSvg>
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  flower: { opacity: 0.45 },
});
