import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  DEFAULT_MEDITATION,
  meditationView,
  type MeditationConfig,
  type MeditationView,
} from "@/assets/data/meditation-core";
import {
  DEFAULT_MEDITATION_TYPE,
  MEDITATION_PRESETS,
  MEDITATION_TYPES,
  meditationType,
  presetLabel,
  type MeditationTypeId,
} from "@/assets/data/meditation-types";
import { fixedColors } from "@/assets/theme/accent";
import { useBreathTheme, type BreathTheme, formatClock } from "@/components/breath/breath-theme";
import { LotusVisual } from "@/components/breath/LotusVisual";
import { useLayoutTier } from "@/components/breath/use-layout-tier";

const SCREEN_H = Dimensions.get("window").height;
const BLOOM_CLOSED = 0.55;
const BLOOM_OPEN = 1;
const TICK_MS = 250;

/**
 * The meditation tab. Replaces HIIT.
 *
 * Borrows the Pranayama frame on purpose: the controls sit over the stage while
 * idle and slide away on Start, which is the ready-set-go the countdown already
 * gives that tab. Same gesture, same muscle memory.
 *
 * What it deliberately does NOT borrow is the count. A sit is meant to be done
 * with the screen ignored, so the clock is opt-in and off by default — watching
 * a timer is the opposite of sitting. The lotus and the bells carry the session.
 */
export default function MeditationScreen() {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const tier = useLayoutTier();

  const [typeId, setTypeId] = useState<MeditationTypeId>(DEFAULT_MEDITATION_TYPE);
  const [totalSec, setTotalSec] = useState<number>(DEFAULT_MEDITATION.totalSec);
  const [showClock, setShowClock] = useState(false);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<MeditationView>(() =>
    meditationView(0, 0, { ...DEFAULT_MEDITATION, totalSec: DEFAULT_MEDITATION.totalSec }),
  );

  const config: MeditationConfig = useMemo(
    () => ({ ...DEFAULT_MEDITATION, totalSec }),
    [totalSec],
  );

  const startedAt = useRef<number | null>(null);
  const prevElapsed = useRef(0);
  const slide = useRef(new Animated.Value(0)).current;
  // The lotus opens across the whole sit rather than with a breath: one slow
  // bloom from settling to the closing bell. Nothing to follow, nothing to pace
  // yourself against — it just marks that time is passing.
  const bloom = useRef(new Animated.Value(BLOOM_CLOSED)).current;

  const stop = useCallback(() => {
    setRunning(false);
    bloom.setValue(BLOOM_CLOSED);
    startedAt.current = null;
    prevElapsed.current = 0;
    setView(meditationView(0, 0, config));
  }, [config, bloom]);

  // Controls slide out of the way while a session runs, and back on stop.
  useEffect(() => {
    Animated.timing(slide, {
      toValue: running ? SCREEN_H : 0,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [running, slide]);

  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    prevElapsed.current = 0;
    const id = setInterval(() => {
      if (startedAt.current === null) return;
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const v = meditationView(elapsed, prevElapsed.current, config);
      prevElapsed.current = elapsed;
      setView(v);
      Animated.timing(bloom, {
        toValue: BLOOM_CLOSED + (BLOOM_OPEN - BLOOM_CLOSED) * v.progress,
        duration: TICK_MS,
        useNativeDriver: true,
      }).start();
      // TODO(round two): v.cue -> play the bell. Deliberately silent for now
      // rather than reusing a breath click that is the wrong sound for a sit.
      if (v.finished) stop();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, config, stop, bloom]);

  const type = meditationType(typeId);
  // `running` is tested FIRST. A stopped session sits at elapsed 0, which is
  // inside the settling window, so checking the phase first made an idle screen
  // announce "Settle" before anything had started.
  const phaseLabel = !running
    ? "Be still"
    : view.phase === "settling"
      ? "Settle"
      : view.phase === "closing"
        ? "Closing"
        : "Sitting";

  const lotusSize = tier === "compact" ? 150 : tier === "expanded" ? 236 : 190;

  return (
    <View style={styles.screen}>
      {/* Stage — the lotus, the phase word, and the clock only if asked for. */}
      <View style={styles.stage}>
        {/* The flower gets its own block so the phase word sits BELOW it rather
            than across the petals. LotusVisual absolute-fills its parent, so the
            spacer is what reserves the room. */}
        <View style={{ height: lotusSize, width: lotusSize }}>
          {running ? <LotusVisual scale={bloom} tint={t.accentSoft} size={lotusSize} /> : null}
        </View>
        <Text style={styles.phase}>{phaseLabel}</Text>
        {showClock ? (
          <Text style={styles.clock}>{formatClock(view.totalRemaining)}</Text>
        ) : (
          <Text style={styles.clockHidden}>{running ? "" : presetLabel(totalSec)}</Text>
        )}
      </View>

      {/* Controls — slide away on Start, exactly as the breath sheet does. */}
      <Animated.View style={[styles.controls, { transform: [{ translateY: slide }] }]}>
        <Text style={styles.section}>TYPE</Text>
        <View style={styles.row}>
          {MEDITATION_TYPES.map((m) => {
            const on = m.id === typeId;
            return (
              <TouchableOpacity
                key={m.id}
                testID={`meditation-type-${m.id}`}
                disabled={!m.available}
                activeOpacity={0.7}
                onPress={() => setTypeId(m.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, disabled: !m.available }}
                style={[styles.chip, on && styles.chipOn, !m.available && styles.chipOff]}
              >
                <Text
                  style={[styles.chipText, on && styles.chipTextOn]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.blurb}>{type.blurb}</Text>

        <Text style={styles.section}>LENGTH</Text>
        <View style={styles.row}>
          {MEDITATION_PRESETS.map((sec) => {
            const on = sec === totalSec;
            return (
              <TouchableOpacity
                key={sec}
                testID={`meditation-length-${sec}`}
                activeOpacity={0.7}
                onPress={() => setTotalSec(sec)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{presetLabel(sec)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          testID="meditation-show-clock"
          activeOpacity={0.7}
          onPress={() => setShowClock((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: showClock }}
          style={styles.check}
        >
          <View style={[styles.box, showClock && styles.boxOn]}>
            {showClock ? <Text style={styles.tick}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>Show the countdown</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.startWrap}>
        <TouchableOpacity
          testID="meditation-start-stop"
          activeOpacity={0.7}
          onPress={() => (running ? stop() : setRunning(true))}
          accessibilityRole="button"
          style={[styles.startBtn, running && styles.stopBtn]}
        >
          <Text style={[styles.startText, running && styles.stopText]}>
            {running ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
    screen: { flex: 1, paddingHorizontal: t.space.md },
    // flex, not a fixed height: a sit is mostly empty screen, and the empty
    // should be distributed around the flower rather than dumped underneath it.
    stage: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: t.space.md,
    },
    // Ink, not the accent — same reasoning as the breath tab's phase word: the
    // one thing you might glance at should not be tinted into the background.
    phase: { color: fixedColors.ink, fontSize: 22, fontWeight: "300", letterSpacing: 2 },
    clock: { color: t.muted, fontSize: 44, fontWeight: "200", marginTop: t.space.sm },
    clockHidden: { color: t.label, fontSize: 15, marginTop: t.space.sm },

    controls: { gap: t.space.sm, paddingTop: t.space.lg },
    section: {
      color: t.label,
      fontSize: 11,
      letterSpacing: 1.5,
      marginTop: t.space.sm,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexBasis: "30%",
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.line,
      borderRadius: t.radius,
      paddingVertical: t.space.xs + 3,
      paddingHorizontal: 6,
    },
    chipOn: { borderColor: t.label },
    chipOff: { opacity: 0.35 },
    chipText: { color: t.muted, fontSize: 14, textAlign: "center" },
    chipTextOn: { color: fixedColors.ink, fontWeight: "600" },
    blurb: { color: t.label, fontSize: 12, paddingTop: 2 },

    check: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: t.space.sm },
    box: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: t.label,
      alignItems: "center",
      justifyContent: "center",
    },
    boxOn: { borderColor: t.accent },
    tick: { color: t.accent, fontSize: 13, lineHeight: 15 },
    checkLabel: { color: t.muted, fontSize: 14 },

    // marginBottom is the RESERVE FOR THE AD BANNER — a 60pt FULL_BANNER is
    // absolutely positioned at the bottom of every tab scene. Making the stage
    // flex:1 without this pushed Start straight under the banner, which is the
    // exact regression BreathScreen already documents at buttonContainerExpanded.
    // Never shrink it below the banner height.
    startWrap: {
      alignItems: "center",
      paddingTop: t.space.lg,
      marginBottom: 80,
    },
    startBtn: {
      borderWidth: 1,
      borderColor: t.label,
      paddingHorizontal: t.space.xl + 12,
      paddingVertical: t.space.md,
      borderRadius: t.radius,
      minWidth: 200,
      alignItems: "center",
    },
    stopBtn: { borderColor: t.accentSoft },
    startText: { color: t.buttonText, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
    stopText: { color: t.accentSoft },
  });
