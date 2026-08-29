import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BreathView } from "@/assets/data/breath-timer-core";
import { useYogaTheme } from "@/components/user-preferences-context";
import { useBreathTheme, type BreathTheme, formatClock } from "./breath-theme";
import { BreatheCircle } from "./BreatheCircle";
import { LayoutTier } from "./use-layout-tier";

/**
 * The live display, split so the counts slide-up can cover the CENTER while the
 * header (total time remaining) stays fixed and always visible:
 *   - BreathStageHeader: "Remaining" label (+ ⓘ) and the countdown — tapping the
 *     number opens the session-length picker. Shared typography with the yoga tab.
 *   - BreathStageCenter: while running, the phase label + glanceable count (or
 *     "Begin in N" during the count-in; idle text otherwise).
 */
export function BreathStageHeader({
  view,
  isRunning,
  onPressClock,
  countIn = null,
  endsOnExhale = false,
  onInfoPress,
  tier = "regular",
}: {
  view: BreathView;
  isRunning: boolean;
  onPressClock?: () => void;
  countIn?: number | null;
  endsOnExhale?: boolean;
  onInfoPress?: () => void;
  tier?: LayoutTier;
}) {
  const t = useBreathTheme();
  const { typography: yogaTypography } = useYogaTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const counting = countIn !== null;
  // The clock (session-length picker) is locked once a sequence is committed —
  // running OR counting in.
  const clockDisabled = isRunning || counting || !onPressClock;
  // During the count-in the hero is "Begin in N" in the center, so the timer
  // shrinks out of its way (the iPhone-SE collision fix: one hero number at a
  // time). Otherwise it scales with the tier.
  const timerSize = counting ? 40 : tier === "compact" ? 48 : tier === "expanded" ? 82 : 72;
  return (
    <View style={styles.header}>
      <View style={styles.labelRow}>
        <Text style={yogaTypography.timerLabel}>Remaining</Text>
        {endsOnExhale && onInfoPress ? (
          <TouchableOpacity
            onPress={onInfoPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="About session length"
          >
            <Text style={styles.info}>{"ⓘ"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity activeOpacity={0.7} disabled={clockDisabled} onPress={onPressClock}>
        <Text style={[yogaTypography.timerCountdown, { fontSize: timerSize }]}>
          {formatClock(view.totalRemaining)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function BreathStageCenter({
  view,
  isRunning,
  metronome = false,
  countIn = null,
  tier = "regular",
}: {
  view: BreathView;
  isRunning: boolean;
  metronome?: boolean;
  countIn?: number | null;
  tier?: LayoutTier;
}) {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const tint = metronome ? t.accentSoft : t.phaseTint[view.kind] ?? t.accentSoft;
  const counting = countIn !== null;
  const showCount = isRunning && view.segmentType === "breath" && view.countRemaining > 0;
  const countSize = tier === "compact" ? 64 : tier === "expanded" ? 112 : 88;
  const phaseSize = tier === "compact" ? 18 : tier === "expanded" ? 28 : 24;
  const centerH = tier === "compact" ? 132 : tier === "expanded" ? 248 : 160;
  // Breathe ring fills the larger tiers (and is the calming visual on iPad);
  // omitted on compact where space is scarce, and on the metronome (no phases).
  const showRing = tier !== "compact" && !metronome && isRunning;
  const ringSize = tier === "expanded" ? 236 : 150;
  return (
    <View style={[styles.center, { height: centerH }]}>
      {showRing ? <BreatheCircle view={view} running={isRunning} size={ringSize} metronome={metronome} /> : null}
      {counting ? (
        <>
          <Text style={[styles.phase, { color: t.accentSoft, fontSize: phaseSize }]}>Begin in</Text>
          <Text style={[styles.count, { color: t.accentSoft, fontSize: countSize }]}>{countIn}</Text>
        </>
      ) : isRunning ? (
        <>
          {!metronome && <Text style={[styles.phase, { color: tint, fontSize: phaseSize }]}>{view.label}</Text>}
          <Text style={[styles.count, { color: tint, fontSize: countSize }]}>
            {showCount ? view.countRemaining : " "}
          </Text>
        </>
      ) : (
        <Text style={styles.idle}>{metronome ? "Metronome" : "Breathe"}</Text>
      )}
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  header: { alignItems: "center", marginTop: 10 }, // mirrors the yoga tab's timer block offset
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  // ⓘ intentionally stays superscript: it has no top margin, so it rides higher
  // than "Remaining" (which carries timerLabel's marginTop:20). The round counter
  // now lives on its own line below the countdown (RoundsIndicator), not inline.
  info: { color: t.muted, fontSize: 15 },
  center: { alignItems: "center", justifyContent: "center" }, // height set per tier
  phase: { fontWeight: "300", letterSpacing: 2 }, // fontSize set per tier
  count: { fontWeight: "200", fontVariant: ["tabular-nums"] }, // fontSize set per tier
  idle: { color: t.muted, fontSize: 22, fontWeight: "300", letterSpacing: 2 },
});
