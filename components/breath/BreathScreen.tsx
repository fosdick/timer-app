import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated, Dimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  METRONOME,
  NADI_SHODHANA,
  BREATH_PATTERNS,
  BreathPattern,
  EditFieldKey,
  getPattern,
  isMetronome,
  applyCountEdit,
  adjustTotalToExhaleEnd,
  cycleDurationSec,
  sessionSecToRounds,
} from "@/assets/data/breath-patterns";
import { useBreathTimer } from "@/assets/utils/use-breath-timer";
import { useAmbience } from "@/assets/utils/use-ambience";
import { useReportActiveTimer } from "@/components/active-timer-context";
import { useUserPreferences, isDownbeatEnabled } from "@/components/user-preferences-context";
import { getData, storeData } from "@/assets/utils/persistent-storage";
import { getTimeParts } from "@/assets/utils/format-time";
import { playStart, playEndChime } from "@/assets/utils/sounds";
import { screenStyles, timerPickerModalStyles } from "@/assets/styles/timer-app";
import { useWindowDimensions } from "react-native";
import { PatternPicker } from "./PatternPicker";
import { CountEditors } from "./CountEditors";
import { BreathStageHeader, BreathStageCenter } from "./BreathStage";
import { RoundsIndicator } from "./RoundsIndicator";
import { SoundOptions } from "./SoundOptions";
import { getClickSound, getAmbience, DEFAULT_CLICK_ID, DEFAULT_DOWNBEAT_ID, DEFAULT_AMBIENCE_ID } from "./breath-sounds";
import { useBreathTheme, type BreathTheme } from "./breath-theme";
import { SessionLengthModal } from "./SessionLengthModal";
import { useLayoutTier } from "./use-layout-tier";

const BREATH_DATA_KEY = "breath_timer_data";
const DEFAULT_TOTAL_SEC = 300; // 5 min
const SCREEN_H = Dimensions.get("window").height; // slide-down distance (clipped)

type CountSet = { inhale: number; holdIn: number; exhale: number; holdOut: number };

const applyCustom = (base: BreathPattern, custom: Record<string, CountSet>): BreathPattern => {
  const c = custom[base.id];
  return c ? { ...base, ...c } : base;
};
const countsOf = (p: BreathPattern): CountSet => ({
  inhale: p.inhale,
  holdIn: p.holdIn,
  exhale: p.exhale,
  holdOut: p.holdOut,
});

/**
 * The breath-pattern timer (pranayama tab). Holds the selected pattern id + any
 * per-pattern edited counts; derives the live pattern from them. Includes the
 * metronome mode (preserves the original pranayama), editable counts via scroll
 * wheels, a session-length picker, sound options, and persisted settings.
 */
export default function BreathScreen() {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const tier = useLayoutTier();
  // "expanded" spans a 956pt Pro Max AND a 1376pt iPad, which need different
  // treatment: the centred-card layout below assumes SURPLUS height, and a Pro
  // Max has none once the 80pt ad-banner reserve is counted. Gate the card on
  // real height — iPads (>=1100: 13" 1376, 11" ~1194, mini 1133) get the card;
  // tall phones keep the normal top-down flow with expanded type sizes.
  const { height: winH } = useWindowDimensions();
  const cardLayout = tier === "expanded" && winH >= 1100;
  const [patternId, setPatternId] = useState<string>(NADI_SHODHANA.id);
  const [customCounts, setCustomCounts] = useState<Record<string, CountSet>>({});
  const [totalSec, setTotalSec] = useState<number>(DEFAULT_TOTAL_SEC);
  // Click / downbeat / ambience are saved PER pattern (like customCounts), so each
  // breath style remembers its own sounds. Resolved to the active pattern below.
  const [clickByPattern, setClickByPattern] = useState<Record<string, string>>({});
  const [downbeatSoundByPattern, setDownbeatSoundByPattern] = useState<Record<string, string>>({});
  const [ambienceByPattern, setAmbienceByPattern] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);

  // Resolved sound ids for the selected pattern (fall back to the global defaults).
  const clickId = clickByPattern[patternId] ?? DEFAULT_CLICK_ID;
  const downbeatId = downbeatSoundByPattern[patternId] ?? DEFAULT_DOWNBEAT_ID;
  const ambienceId = ambienceByPattern[patternId] ?? DEFAULT_AMBIENCE_ID;

  // The counts/downbeat slide-up overlay covers the stage when open (idle) and
  // slides down out of view while a session runs.
  const slide = useRef(new Animated.Value(0)).current;

  // Memoized so the pattern reference is stable across renders (a new object
  // each render would thrash the timer's memo/effects).
  const pattern = useMemo(
    () => applyCustom(getPattern(patternId) ?? METRONOME, customCounts),
    [patternId, customCounts],
  );
  const metro = isMetronome(pattern);

  const { prefs, setDownbeatEnabled } = useUserPreferences();
  // Per-pattern downbeat snap (a pulse on each count during inhale/exhale).
  // Metronome has no breath phases, so it never gets downbeats.
  const patternDownbeatOn = isDownbeatEnabled(prefs, patternId);
  const downbeatActive = patternDownbeatOn && !metro;
  // The session ends on an exhale (when the user pref is on): round the chosen
  // length UP to the end of an exhale phase (whole rounds for Nadi). `totalSec`
  // stays the user's raw pick; this derived value is what the timer runs and the
  // UI shows. Metronome is unaffected (no exhale to land on). Must use the SAME
  // timeline opts as the timer below so the end bell lands exactly on the exhale.
  const endsOnExhale = prefs.useRounds && !metro;
  const effectiveTotalSec = useMemo(
    () =>
      prefs.useRounds
        ? adjustTotalToExhaleEnd(pattern, totalSec, {
            countDurationSec: 1,
          })
        : totalSec,
    [pattern, totalSec, metro, prefs.useRounds],
  );

  const showExhaleInfo = () =>
    Alert.alert(
      "Why rounds, not minutes",
      "Pranayama is measured in complete breaths — rounds — not clock time. " +
        "Each round ends on the exhale, the releasing half of the breath: a long " +
        "exhale engages the calming (parasympathetic) response and completes the " +
        "cycle of drawing prana in and letting it go. Finishing mid-inhale or on a " +
        "held breath leaves you activated, with the energy unsettled.\n\n" +
        "So you choose how many rounds to practice and the time shown is the result. " +
        "(The Metronome has no breath phases, so it's set by total time instead.)",
      [{ text: "Got it", style: "cancel" }],
    );

  // Restore saved settings on mount.
  useEffect(() => {
    (async () => {
      const saved = await getData(BREATH_DATA_KEY);
      if (saved?.breathPatternId && getPattern(saved.breathPatternId)) setPatternId(saved.breathPatternId);
      if (saved?.breathCustomCounts) setCustomCounts(saved.breathCustomCounts);
      if (saved?.breathTotalSec) setTotalSec(saved.breathTotalSec);
      // Sounds: prefer the per-pattern maps; migrate an older single global value
      // (apply it to every pattern) so a prior choice isn't lost on upgrade.
      const seedAll = (v: string) => Object.fromEntries(BREATH_PATTERNS.map((p) => [p.id, v]));
      setClickByPattern(saved?.breathClickByPattern ?? (saved?.breathClick ? seedAll(saved.breathClick) : {}));
      setDownbeatSoundByPattern(
        saved?.breathDownbeatByPattern ?? (saved?.breathDownbeat ? seedAll(saved.breathDownbeat) : {}),
      );
      setAmbienceByPattern(saved?.breathAmbienceByPattern ?? (saved?.breathAmbience ? seedAll(saved.breathAmbience) : {}));
    })();
  }, []);

  // Start/end chimes match the yoga tab (canonical behavior — see the old
  // pranayama component): bell-hit on Start, end-bell when the session ends.
  const timer = useBreathTimer(pattern, effectiveTotalSec, {
    onClick: () => getClickSound(clickId).play(),
    onFinish: () => playEndChime(),
    // Downbeat snap on each count during inhale/exhale, when enabled for this
    // pattern. undefined disables the per-count work entirely in the hook.
    onDownbeat: downbeatActive ? () => getClickSound(downbeatId).play() : undefined,
  });

  useAmbience(getAmbience(ambienceId).asset, timer.isRunning);

  // Count-in ("Begin in N"): a pre-roll before a FRESH sequence so the user can
  // settle / place their hands (esp. Nadi Shodhana) before the practice starts.
  // null = not counting in. It does NOT run on resume — only a fresh start.
  const [countIn, setCountIn] = useState<number | null>(null);
  const countInRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = timer.isRunning || countIn !== null;

  const stopCountIn = () => {
    if (countInRef.current) {
      clearInterval(countInRef.current);
      countInRef.current = null;
    }
    setCountIn(null);
  };

  const beginCountIn = () => {
    // Duration comes from User Preferences ("Begin in" pre-roll).
    let remaining = prefs.countInSec;
    setCountIn(remaining);
    countInRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        stopCountIn();
        // The actual sequence begins now — start chime then the timer (the
        // existing Start behavior, just deferred past the count-in).
        playStart();
        timer.start();
      } else {
        setCountIn(remaining);
      }
    }, 1000);
  };

  // Clean up the count-in ticker on unmount.
  useEffect(() => () => {
    if (countInRef.current) clearInterval(countInRef.current);
  }, []);

  // Stop the session when the tab loses focus (e.g. confirming a tab switch),
  // mirroring the yoga tab — so a running breath timer/count-in doesn't keep
  // going on another tab.
  const stopTimer = timer.stop;
  useFocusEffect(
    useCallback(
      () => () => {
        if (countInRef.current) {
          clearInterval(countInRef.current);
          countInRef.current = null;
        }
        setCountIn(null);
        stopTimer();
      },
      [stopTimer],
    ),
  );

  // Slide the counts overlay down on Start (active), back up on Stop.
  useEffect(() => {
    Animated.timing(slide, {
      toValue: active ? SCREEN_H : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [active, slide]);

  const onPressStartStop = () => {
    if (countIn !== null) {
      stopCountIn(); // cancel the count-in (sequence never started)
      return;
    }
    if (timer.isRunning) {
      timer.stop();
      return;
    }
    // Fresh start (at the beginning or after finishing) gets the count-in when
    // it's enabled in User Preferences; resuming a paused sequence — or a fresh
    // start with the count-in disabled — starts immediately, as before.
    const fresh = timer.view.finished || timer.view.totalRemaining >= effectiveTotalSec;
    if (fresh && prefs.countInEnabled) {
      beginCountIn();
    } else {
      playStart();
      timer.start();
    }
  };

  // Report to the tab bar so an accidental tab tap mid-session (incl. during
  // the count-in) is confirmed.
  useReportActiveTimer("breath", active);

  // "Round N of M" shown inline beside the Remaining label — always visible for
  // breath patterns with rounds on (idle shows "Round 1 of M"), independent of
  // the slide-up/run state. The metronome has no rounds. A round spans
  // setsPerRound cycles (Nadi: 2); the math mirrors the rounds picker so the
  // count lines up with the chosen session length.
  const rounds = useMemo(() => {
    if (metro || !prefs.useRounds) return null;
    const cycleDur = cycleDurationSec(pattern, { countDurationSec: 1 });
    const sets = Math.max(1, Math.floor(pattern.setsPerRound ?? 1));
    const roundDur = sets * cycleDur;
    if (roundDur <= 0) return null;
    const total = sessionSecToRounds(pattern, effectiveTotalSec, { countDurationSec: 1 });
    const elapsed = effectiveTotalSec - timer.view.totalRemaining;
    const current = Math.min(total, Math.max(1, Math.floor(elapsed / roundDur) + 1));
    return { current, total };
  }, [metro, prefs.useRounds, pattern, effectiveTotalSec, timer.view.totalRemaining]);

  const persist = (over: Partial<Parameters<typeof storeData>[1]>) => {
    storeData(BREATH_DATA_KEY, {
      breathPatternId: patternId,
      breathTotalSec: totalSec,
      breathClickByPattern: clickByPattern,
      breathDownbeatByPattern: downbeatSoundByPattern,
      breathAmbienceByPattern: ambienceByPattern,
      breathCustomCounts: customCounts,
      ...over,
    });
  };

  // Commit a new session length (from either picker), reset the timer, persist.
  const applyTotal = (newTotal: number) => {
    setTotalSec(newTotal);
    setShowPicker(false);
    timer.reset();
    persist({ breathTotalSec: newTotal });
  };

  const choosePattern = (p: BreathPattern) => {
    if (active) return;
    timer.reset();
    setPatternId(p.id);
    persist({ breathPatternId: p.id });
  };

  const editCount = (key: EditFieldKey, value: number) => {
    if (active) return;
    const next = applyCountEdit(pattern, key, value);
    const nextCustom = { ...customCounts, [patternId]: countsOf(next) };
    setCustomCounts(nextCustom);
    timer.reset();
    persist({ breathCustomCounts: nextCustom });
  };

  // The pattern + sound controls. On compact screens they live INSIDE the
  // slide-up sheet (so Start reveals a clean focus view); on larger screens they
  // sit on-screen below the stage. Defined once, placed in one spot or the other.
  const compact = tier === "compact";
  const patternPicker = (
    <PatternPicker selectedId={pattern.id} onSelect={choosePattern} disabled={active} />
  );
  const soundOptions = (
    <SoundOptions
      clickId={clickId}
      ambienceId={ambienceId}
      onClickChange={(id) => {
        const next = { ...clickByPattern, [patternId]: id };
        setClickByPattern(next);
        persist({ breathClickByPattern: next });
      }}
      onAmbienceChange={(id) => {
        const next = { ...ambienceByPattern, [patternId]: id };
        setAmbienceByPattern(next);
        persist({ breathAmbienceByPattern: next });
      }}
      disabled={active}
      downbeatId={metro ? undefined : downbeatId}
      onDownbeatChange={
        metro
          ? undefined
          : (id) => {
              const next = { ...downbeatSoundByPattern, [patternId]: id };
              setDownbeatSoundByPattern(next);
              persist({ breathDownbeatByPattern: next });
            }
      }
      downbeatDisabled={!patternDownbeatOn}
    />
  );

  return (
    <View
      style={[
        styles.screen,
        tier === "expanded" && styles.expandedColumn,
        cardLayout && styles.expandedCenter,
      ]}
    >
      {/* Fixed header: the countdown / session-length picker, always visible. */}
      <BreathStageHeader
        view={timer.view}
        isRunning={timer.isRunning}
        countIn={countIn}
        endsOnExhale={endsOnExhale}
        onInfoPress={showExhaleInfo}
        onPressClock={() => setShowPicker(true)}
        tier={tier}
      />

      {/* Round N of M directly under the total time — but only once a session is
          underway (running or counting in). Hidden while idle so the setup menu
          (incl. the downbeat-snap checkbox) has the full height. */}
      {active && rounds ? <RoundsIndicator current={rounds.current} total={rounds.total} /> : null}

      {/* Center region: the live breathe display, with the counts slide-up over
          it. The overlay anchors to the top of the controls (its bottom = the
          pattern buttons' top) and slides down to reveal the center on Start. */}
      <View
        style={[
          styles.midWrap,
          cardLayout && styles.midWrapExpanded,
          compact && styles.midWrapCompact,
        ]}
      >
        <BreathStageCenter
          view={timer.view}
          isRunning={timer.isRunning}
          metronome={metro}
          countIn={countIn}
          tier={tier}
        />
        <Animated.View
          pointerEvents={active ? "none" : "auto"}
          style={[styles.countsOverlay, { transform: [{ translateY: slide }] }]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.countsOverlayContent,
              // Compact: the full control set lives in this sheet, which can be
              // taller than the short screen (iPhone SE). Top-align + scroll, and
              // reserve clearance at the bottom so the last rows (downbeat snap /
              // sounds) never collide with the bottom-anchored Start button.
              compact && styles.countsOverlaySheetCompact,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Compact: the style picker leads the setup sheet. */}
            {compact && patternPicker}
            <CountEditors
              pattern={pattern}
              activeKind={undefined}
              onChange={editCount}
              disabled={active}
            />
            {!metro && (
              <TouchableOpacity
                style={styles.downbeatToggle}
                activeOpacity={0.7}
                onPress={() => setDownbeatEnabled(patternId, !patternDownbeatOn)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: patternDownbeatOn }}
              >
                <View style={[styles.dbBox, patternDownbeatOn && styles.dbBoxOn]}>
                  {patternDownbeatOn ? <Text style={styles.dbTick}>{"✓"}</Text> : null}
                </View>
                <Text style={styles.dbLabel}>Downbeat snap on each count</Text>
              </TouchableOpacity>
            )}
            {/* Compact: sounds round out the setup sheet. */}
            {compact && soundOptions}
          </ScrollView>
        </Animated.View>
      </View>

      {/* On larger screens the controls stay on-screen below the stage; on
          compact they moved into the sheet above (Start reveals a focus view). */}
      {!compact && (
        <View style={styles.controls}>
          {patternPicker}
          {soundOptions}
        </View>
      )}

      {/* Bottom-anchored like the yoga tab's button (same shared container),
          so switching tabs doesn't make the button appear to jump. */}
      <View
        style={[
          screenStyles.buttonContainer,
          cardLayout && styles.buttonContainerExpanded,
        ]}
      >
        <TouchableOpacity
          testID="breath-start-stop"
          activeOpacity={0.7}
          style={[styles.startBtn, active && styles.stopBtn]}
          onPress={onPressStartStop}
        >
          <Text style={[styles.startText, active && styles.stopText]}>
            {active ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Session length: with "Use rounds" on, real patterns pick a number of
          ROUNDS (always ends on an exhale). The metronome — and any pattern when
          "Use rounds" is off — use the plain time wheel instead. */}
      {metro || !prefs.useRounds ? (
        <TimerPickerModal
          visible={showPicker}
          setIsVisible={setShowPicker}
          initialValue={getTimeParts(totalSec)}
          onConfirm={(picked) =>
            applyTotal(picked.hours * 3600 + picked.minutes * 60 + picked.seconds)
          }
          modalTitle="Session length"
          onCancel={() => setShowPicker(false)}
          closeOnOverlayPress
          Audio={Audio}
          LinearGradient={LinearGradient}
          styles={timerPickerModalStyles}
          modalProps={{ overlayOpacity: 0.2 }}
        />
      ) : (
        <SessionLengthModal
          visible={showPicker}
          pattern={pattern}
          initialTotalSec={totalSec}
          onConfirm={applyTotal}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg, paddingHorizontal: t.space.lg },
  // iPad / very large screens: cap the column and center it so controls don't
  // stretch edge-to-edge and the layout reads as designed, not stretched.
  expandedColumn: { maxWidth: 600, width: "100%", alignSelf: "center" },
  // iPad also needs a VERTICAL bound. midWrap is flex:1, so on a 1376pt-tall
  // iPad it swallowed ~670pt of slack: the countdown stranded at the top, the
  // counts floating in the middle of a huge empty band, and Start pinned to the
  // bottom by buttonContainer's marginTop:"auto". Capping midWrap and centering
  // the whole column turns that dead space into symmetric margins, so the
  // layout reads as a centred card instead of a stretched phone screen.
  expandedCenter: { justifyContent: "center" },
  midWrapExpanded: { flex: 0, height: 360 },
  // iPhone SE (375x667, the only tier-compact device class): the sheet is taller
  // than its viewport, so it scrolls — and the viewport's edges are exactly the
  // countdown above and the Start button below. At rest that put "Downbeat snap
  // on each count" flush against Start's top border with its checkbox sliced in
  // half, and scrolled content clipped hard under the countdown. contentContainer
  // paddingBottom canNOT fix this: it adds scrollable room INSIDE the content,
  // while the collision is at the viewport boundary. Real clearance is needed, so
  // whatever the scroll position, clipped rows never touch either neighbour.
  midWrapCompact: { marginTop: 6, marginBottom: 16 },
  // Only marginTop is overridden here. The shared buttonContainer's
  // marginBottom: 80 is the RESERVE FOR THE AD BANNER (a 60pt FULL_BANNER is
  // absolutely positioned at the bottom of every tab scene) — overriding it to 24
  // is what let a banner cover the Start button on the expanded tier. Never
  // shrink marginBottom below the banner height; tighten the card with marginTop.
  buttonContainerExpanded: { marginTop: 24 },
  // Center region between the fixed countdown header and the fixed controls.
  // The counts overlay is clipped to it (overflow hidden) so it slides down out
  // of view without bleeding onto the controls/countdown.
  midWrap: {
    flex: 1,
    alignSelf: "stretch",
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  countsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: t.bg },
  countsOverlayContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.space.md,
    padding: t.space.md,
  },
  // Compact override: scroll from the top and keep ~96pt of clearance below the
  // last control so it stays above the Start button on short screens.
  countsOverlaySheetCompact: { justifyContent: "flex-start", paddingBottom: 96 },
  controls: { alignItems: "center", gap: t.space.md, paddingVertical: t.space.md },
  startBtn: {
    borderWidth: 1,
    borderColor: t.label, // toned from t.border (#91BD27) with the rest
    paddingHorizontal: t.space.xl + 12,
    paddingVertical: t.space.md,
    borderRadius: t.radius,
    minWidth: 200,
    alignItems: "center",
  },
  stopBtn: { borderColor: t.accentSoft }, // light green while running (matches yoga/HIIT)
  startText: { color: t.buttonText, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
  stopText: { color: t.accentSoft },
  downbeatToggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  dbBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1, // was 2 — the thickest outline in the tab
    borderColor: t.label,
    alignItems: "center",
    justifyContent: "center",
  },
  dbBoxOn: { backgroundColor: t.accentSoft, borderColor: t.accentSoft },
  dbTick: { color: t.bg, fontSize: 13, fontWeight: "900", lineHeight: 15 },
  dbLabel: { color: t.muted, fontSize: 14 },
});
