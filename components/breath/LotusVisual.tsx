import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { lotus } from "@/assets/data/lotus";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const VIEW_BOX = "-60 -60 120 120";
const PETALS = lotus();

/**
 * The lotus, drawn and scaled — and nothing else.
 *
 * Split out of BreatheLotus so the Meditation tab can use it without pretending
 * to be a breath session. The first attempt passed a fake BreathView with
 * countRemaining: 0 and segmentType: "breath" filled in to satisfy the type,
 * which would have made any change to BreathView silently break meditation.
 *
 * This component knows a scale value, a colour and a size. What drives the scale
 * is the caller's business: breath phases on one tab, elapsed progress on the
 * other.
 */
export function LotusVisual({
  scale,
  tint,
  size,
  opacity = 0.45,
}: {
  scale: Animated.Value;
  tint: string;
  size: number;
  opacity?: number;
}) {
  const styles = useMemo(() => makeStyles(opacity), [opacity]);
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
            transform={`rotate(${p.angle})`}
          />
        ))}
      </AnimatedSvg>
    </View>
  );
}

const makeStyles = (opacity: number) =>
  StyleSheet.create({
    wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    flower: { opacity },
  });
