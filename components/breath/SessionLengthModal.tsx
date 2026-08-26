/**
 * SessionLengthModal — the breath session-length picker for an actual breath
 * PATTERN (not the metronome, which has no rounds and keeps the time wheel).
 *
 * Instead of picking a raw time and hoping the "end on exhale" auto-correct
 * lands somewhere sensible, the user picks a NUMBER OF ROUNDS. A round always
 * finishes on the final exhale (any trailing retention is dropped), so the
 * resulting session is unambiguous — the math lives in roundsToSessionSec /
 * sessionSecToRounds. We also surface the resulting clock time and an
 * exhale indicator so the choice is legible.
 *
 * Buttons (Cancel / Confirm) use the breath tab's bordered button language so
 * they match the rest of the app rather than the third-party picker's defaults.
 */
import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  BreathPattern,
  roundsToSessionSec,
  sessionSecToRounds,
} from "@/assets/data/breath-patterns";
import {
  formatMinutesSeconds,
  getTimePartsMinSec,
} from "@/assets/utils/format-time";
import { breathTheme as t } from "./breath-theme";

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 99;
// Match the live timer's timeline opts so the computed length lines up exactly
// with where the session's end bell will fire (no click slot; 1s per count).
const OPTS = { countDurationSec: 1 };

const clampRounds = (n: number) =>
  Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(n)));

export function SessionLengthModal({
  visible,
  pattern,
  initialTotalSec,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  pattern: BreathPattern;
  initialTotalSec: number;
  onConfirm: (totalSec: number) => void;
  onCancel: () => void;
}) {
  const [rounds, setRounds] = useState(MIN_ROUNDS);

  // Seed the stepper from the current length each time the modal opens.
  useEffect(() => {
    if (visible) {
      setRounds(clampRounds(sessionSecToRounds(pattern, initialTotalSec, OPTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sessionSec = roundsToSessionSec(pattern, rounds, OPTS);
  // A round ends on the exhale; for patterns with a closing retention that
  // retention is dropped at the very end — call it out so it isn't a surprise.
  const droppedHold = pattern.holdOut > 0;

  const dec = () => setRounds((r) => Math.max(MIN_ROUNDS, r - 1));
  const inc = () => setRounds((r) => Math.min(MAX_ROUNDS, r + 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Session length</Text>
          <Text style={styles.subtitle}>{pattern.name}</Text>

          {/* Rounds stepper — mirrors the yoga Pace PauseStepper idiom. */}
          <View style={styles.stepperRow}>
            <StepButton label="−" onPress={dec} disabled={rounds <= MIN_ROUNDS} />
            <View style={styles.valueCol}>
              <Text style={styles.value}>{rounds}</Text>
              <Text style={styles.valueUnit}>{rounds === 1 ? "round" : "rounds"}</Text>
            </View>
            <StepButton label="+" onPress={inc} disabled={rounds >= MAX_ROUNDS} />
          </View>

          {/* Resulting clock time + where it lands. */}
          <Text style={styles.duration}>
            {formatMinutesSeconds(getTimePartsMinSec(sessionSec))}
          </Text>
          <Text style={styles.exhaleNote}>
            Ends on an exhale
            {droppedHold ? ` · final ${pattern.holdOut}s retention dropped` : ""}
          </Text>

          {/* Cancel / Confirm — breath-tab bordered buttons. */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, styles.btnCancelText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm]}
              activeOpacity={0.7}
              onPress={() => onConfirm(sessionSec)}
            >
              <Text style={[styles.btnText, styles.btnConfirmText]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.stepBtn, disabled && styles.stepBtnDisabled]}
      onPress={() => !disabled && onPress()}
      activeOpacity={disabled ? 1 : 0.6}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.stepBtnText, disabled && styles.stepBtnTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: t.space.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: t.surface,
    borderRadius: t.radius + 4,
    borderWidth: 1,
    borderColor: t.line,
    padding: t.space.lg,
    alignItems: "center",
    gap: t.space.sm,
  },
  title: { color: t.text, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
  subtitle: { color: t.muted, fontSize: 15, marginBottom: t.space.sm },

  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: t.space.lg,
    marginVertical: t.space.sm,
  },
  valueCol: { alignItems: "center", minWidth: 90 },
  value: {
    color: t.text,
    fontSize: 56,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  valueUnit: { color: t.muted, fontSize: 15, letterSpacing: 1 },

  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { borderColor: t.line, opacity: 0.4 },
  stepBtnText: { color: t.buttonText, fontSize: 28, fontWeight: "400", lineHeight: 30 },
  stepBtnTextDisabled: { color: t.muted },

  duration: {
    color: t.text,
    fontSize: 22,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    marginTop: t.space.sm,
  },
  exhaleNote: { color: t.accentSoft, fontSize: 13, marginBottom: t.space.md, textAlign: "center" },

  actions: {
    flexDirection: "row",
    gap: t.space.md,
    alignSelf: "stretch",
    marginTop: t.space.xs,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: t.radius,
    paddingVertical: t.space.md,
    alignItems: "center",
  },
  btnText: { fontSize: 18, fontWeight: "600", letterSpacing: 1 },
  btnCancel: { borderColor: t.line },
  btnCancelText: { color: t.muted },
  btnConfirm: { borderColor: t.border },
  btnConfirmText: { color: t.buttonText },
});
