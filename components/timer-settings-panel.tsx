/**
 * TimerSettingsPanel
 *
 * Slide-down overlay panel for configuring the two built-in timer events:
 *
 *   Main Transition – pause duration + sound between poses / manual repeats
 *   Half Mark       – pause duration + sound at the halfway point + on/off toggle
 *
 * Sound selection is intentionally NOT persisted in this iteration.
 * Pause durations and the half-mark toggle are persisted by the parent (yoga-view).
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { yogaColors } from "@/assets/theme";

// ─── Sound preview helper ─────────────────────────────────────────────────────
// Module-level ref so only one preview plays at a time and we can stop it
// when the picker or panel closes (important for long sounds like ocean wave).

let _previewSound: Audio.Sound | null = null;

export const stopPreviewSound = () => {
  if (_previewSound) {
    const s = _previewSound;
    _previewSound = null;
    s.stopAsync().catch(() => {}).finally(() => s.unloadAsync().catch(() => {}));
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const playPreviewSound = (requireResult: any) => {
  stopPreviewSound(); // stop any currently-playing preview first
  const play = async () => {
    const { sound } = await Audio.Sound.createAsync(requireResult);
    _previewSound = sound;
    await sound.playAsync();
  };
  play();
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Sound option types ───────────────────────────────────────────────────────

export type TransitionSoundId = "swoosh" | "end-bell" | "ocean";
export type HalfMarkSoundId = "sticks" | "snap" | "bell";

export interface SoundOption<T> {
  id: T;
  label: string;
  onPreview: () => void;
}

/* eslint-disable @typescript-eslint/no-var-requires */

// First entry = current coded default, shown first in picker
export const TRANSITION_SOUNDS: SoundOption<TransitionSoundId>[] = [
  {
    id: "swoosh",
    label: "Swoosh",
    onPreview: () =>
      playPreviewSound(require("../assets/sounds/733936__creator_gt__swoosh-04.wav")),
  },
  {
    id: "end-bell",
    label: "End Bell",
    onPreview: () =>
      playPreviewSound(require("../assets/sounds/end-bell.wav")),
  },
  {
    id: "ocean",
    label: "Ocean Wave",
    onPreview: () =>
      playPreviewSound(require("../assets/sounds/442944__qubodup__ocean-wave.wav")),
  },
];

export const HALF_MARK_SOUNDS: SoundOption<HalfMarkSoundId>[] = [
  {
    id: "sticks",
    label: "Sticks",
    onPreview: () =>
      playPreviewSound(require("../assets/sounds/sticks-low-1.wav")),
  },
  {
    id: "snap",
    label: "Snap",
    onPreview: () => playPreviewSound(require("../assets/sounds/snap.wav")),
  },
  {
    id: "bell",
    label: "Bell Hit",
    onPreview: () =>
      playPreviewSound(
        require("../assets/sounds/350548__fairhavencollection__bell-hit.wav"),
      ),
  },
];

/* eslint-enable @typescript-eslint/no-var-requires */

// ─── Stepper constants ────────────────────────────────────────────────────────

export const PAUSE_STEP_MS = 500;
export const PAUSE_MIN_MS = 0;
export const PAUSE_MAX_MS = 30000; // 30 s ceiling so a 5 s default still has ample headroom

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TimerSettingsPanelProps {
  visible: boolean;
  onClose: () => void;

  // Main transition
  transitionPauseMs: number;
  onTransitionPauseMsChange: (ms: number) => void;
  transitionSound: TransitionSoundId;
  onTransitionSoundChange: (sound: TransitionSoundId) => void;

  // Half mark
  halfMarkPauseMs: number;
  onHalfMarkPauseMsChange: (ms: number) => void;
  halfMarkSound: HalfMarkSoundId;
  onHalfMarkSoundChange: (sound: HalfMarkSoundId) => void;
  halfMarkEnabled: boolean;
  onHalfMarkEnabledChange: (enabled: boolean) => void;

  /**
   * "Save as Pace" action. The panel closes itself first (stopping any
   * preview sound) and then invokes this callback so the parent can open
   * the Pace form modal pre-filled with the current settings values.
   */
  onSavePace: () => void;
}

// ─── PauseStepper ─────────────────────────────────────────────────────────────

interface PauseStepperProps {
  valueMs: number;
  onChange: (ms: number) => void;
  /** Optional override for the min value (ms). Defaults to PAUSE_MIN_MS (0). */
  minMs?: number;
  /** Optional override for the max value (ms). Defaults to PAUSE_MAX_MS (30000). */
  maxMs?: number;
  /** Optional override for the step size (ms). Defaults to PAUSE_STEP_MS (500). */
  stepMs?: number;
  /**
   * Optional override for how the value is formatted in the middle column.
   * Default renders `(valueMs / 1000).toFixed(1) + 's'` (e.g. "5.0s").
   * Pranayama passes a 1-second-resolution integer formatter (e.g. "3s").
   */
  formatValue?: (ms: number) => string;
  /**
   * Optional disabled state — both buttons go inactive and the value renders
   * dimmed. Pranayama uses this when a pattern locks the chime cadence to its
   * unit (e.g. Viloma forces 2s).
   */
  disabled?: boolean;
}

export const PauseStepper = ({
  valueMs,
  onChange,
  minMs = PAUSE_MIN_MS,
  maxMs = PAUSE_MAX_MS,
  stepMs = PAUSE_STEP_MS,
  formatValue = (ms) => `${(ms / 1000).toFixed(1)}s`,
  disabled = false,
}: PauseStepperProps) => {
  const canDecrement = !disabled && valueMs > minMs;
  const canIncrement = !disabled && valueMs < maxMs;

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepperButton, !canDecrement && styles.stepperButtonDisabled]}
        onPress={() => canDecrement && onChange(valueMs - stepMs)}
        activeOpacity={canDecrement ? 0.6 : 1}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepperButtonText, !canDecrement && styles.stepperButtonTextDisabled]}>
          −
        </Text>
      </TouchableOpacity>

      {/* Fixed width keeps the + button in the same column regardless of digit count */}
      <Text style={[styles.stepperValue, disabled && styles.stepperValueDisabled]}>
        {formatValue(valueMs)}
      </Text>

      <TouchableOpacity
        style={[styles.stepperButton, !canIncrement && styles.stepperButtonDisabled]}
        onPress={() => canIncrement && onChange(valueMs + stepMs)}
        activeOpacity={canIncrement ? 0.6 : 1}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepperButtonText, !canIncrement && styles.stepperButtonTextDisabled]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── SoundPickerModal ─────────────────────────────────────────────────────────

export interface SoundPickerModalProps<T extends string> {
  visible: boolean;
  title: string;
  options: SoundOption<T>[];
  selected: T;
  onSelect: (id: T) => void; // updates selection but does NOT close modal
  onClose: () => void;       // only Done button triggers this
}

export function SoundPickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: SoundPickerModalProps<T>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Stop tap-through on the card */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{title}</Text>

            {options.map((opt) => (
              <View key={opt.id} style={styles.pickerOptionRow}>

                {/* Radio + label — selecting does NOT close the modal */}
                <TouchableOpacity
                  style={styles.pickerSelectArea}
                  activeOpacity={0.7}
                  onPress={() => onSelect(opt.id)}
                >
                  <View style={styles.pickerRadio}>
                    {selected === opt.id && <View style={styles.pickerRadioDot} />}
                  </View>
                  <Text style={styles.pickerOptionLabel}>{opt.label}</Text>
                </TouchableOpacity>

                {/* Play preview button */}
                <TouchableOpacity
                  style={styles.pickerPlayButton}
                  activeOpacity={0.6}
                  onPress={opt.onPreview}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.pickerPlayIcon}>▶</Text>
                </TouchableOpacity>

              </View>
            ))}

            <TouchableOpacity style={styles.pickerDoneButton} onPress={onClose}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  pauseMs: number;
  onPauseMsChange: (ms: number) => void;
  onSoundPickerPress: () => void;
  /** When true, renders a Switch.  When false, renders a spacer so the ♪
   *  button stays in the same column as the Half Mark row's ♪ button. */
  toggleEnabled?: boolean;
  onToggleChange?: (enabled: boolean) => void;
  showToggleSpacer?: boolean;
}

const SettingRow = ({
  label,
  pauseMs,
  onPauseMsChange,
  onSoundPickerPress,
  toggleEnabled,
  onToggleChange,
  showToggleSpacer = false,
}: SettingRowProps) => (
  <View style={styles.settingRow}>
    {/* Fixed-width label keeps both rows' controls at the same x offset */}
    <Text style={styles.settingLabel}>{label}</Text>

    <View style={styles.settingControls}>
      <PauseStepper valueMs={pauseMs} onChange={onPauseMsChange} />

      <TouchableOpacity
        style={styles.soundPickerButton}
        onPress={onSoundPickerPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.soundPickerIcon}>♪</Text>
      </TouchableOpacity>

      {/* Toggle or same-width spacer to keep ♪ column aligned between rows */}
      {toggleEnabled !== undefined && onToggleChange ? (
        <Switch
          value={toggleEnabled}
          onValueChange={onToggleChange}
          trackColor={{ false: "#555", true: yogaColors.timerCountdown }}
          thumbColor={toggleEnabled ? "#fff" : "#bbb"}
          style={styles.toggle}
        />
      ) : showToggleSpacer ? (
        <View style={styles.toggleSpacer} />
      ) : null}
    </View>
  </View>
);

// ─── TimerSettingsPanel ───────────────────────────────────────────────────────

export const TimerSettingsPanel = ({
  visible,
  onClose,
  transitionPauseMs,
  onTransitionPauseMsChange,
  transitionSound,
  onTransitionSoundChange,
  halfMarkPauseMs,
  onHalfMarkPauseMsChange,
  halfMarkSound,
  onHalfMarkSoundChange,
  halfMarkEnabled,
  onHalfMarkEnabledChange,
  onSavePace,
}: TimerSettingsPanelProps) => {
  const [showTransitionPicker, setShowTransitionPicker] = useState(false);
  const [showHalfMarkPicker, setShowHalfMarkPicker] = useState(false);

  // Stop any preview sound before closing the panel
  const handleClose = () => {
    stopPreviewSound();
    onClose();
  };

  // Save-as-Pace: dismiss the panel cleanly first so the form modal can
  // present without overlapping the slide-down panel.
  const handleSavePace = () => {
    stopPreviewSound();
    onClose();
    onSavePace();
  };

  // Slide-down animation
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop — covers everything below, including the hamburger */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Panel — slides down from top, above the backdrop */}
      <Animated.View
        style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Timer Settings</Text>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Main Transition row — spacer keeps ♪ column aligned with Half Mark */}
        <SettingRow
          label="Main Transition"
          pauseMs={transitionPauseMs}
          onPauseMsChange={onTransitionPauseMsChange}
          onSoundPickerPress={() => setShowTransitionPicker(true)}
          showToggleSpacer
        />

        <View style={styles.rowDivider} />

        {/* Half Mark row */}
        <SettingRow
          label="Half Mark"
          pauseMs={halfMarkPauseMs}
          onPauseMsChange={onHalfMarkPauseMsChange}
          onSoundPickerPress={() => setShowHalfMarkPicker(true)}
          toggleEnabled={halfMarkEnabled}
          onToggleChange={onHalfMarkEnabledChange}
        />

        {/* Save-as-Pace button — opens form pre-filled with current values */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePace}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save as Pace</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Sound picker modals */}
      <SoundPickerModal
        visible={showTransitionPicker}
        title="Transition Sound"
        options={TRANSITION_SOUNDS}
        selected={transitionSound}
        onSelect={onTransitionSoundChange}
        onClose={() => { stopPreviewSound(); setShowTransitionPicker(false); }}
      />

      <SoundPickerModal
        visible={showHalfMarkPicker}
        title="Half Mark Sound"
        options={HALF_MARK_SOUNDS}
        selected={halfMarkSound}
        onSelect={onHalfMarkSoundChange}
        onClose={() => { stopPreviewSound(); setShowHalfMarkPicker(false); }}
      />
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Backdrop + panel ──────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 20, // above hamburger (zIndex 10)
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 21, // above backdrop
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  panelTitle: {
    color: yogaColors.poseCurrentName,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  closeButton: {
    color: yogaColors.instructionalText, // sage green — matches hamburger
    fontSize: 18,
    lineHeight: 22,
  },

  // ── Dividers ──────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginBottom: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 12,
  },

  // ── Setting row ───────────────────────────────────────────────────────────
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  settingLabel: {
    color: yogaColors.poseCurrentName,
    fontSize: 15,
    width: 120, // fixed width — both rows' controls start at the same x
    marginRight: 8,
  },
  settingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // ── Stepper ───────────────────────────────────────────────────────────────
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: "#222",
  },
  stepperButtonText: {
    color: yogaColors.poseCurrentName,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "500",
  },
  stepperButtonTextDisabled: {
    color: "#555",
  },
  stepperValue: {
    color: yogaColors.timerCountdown,
    fontSize: 14,
    fontWeight: "600",
    width: 46, // fixed — keeps + column steady for values 0.0s – 30.0s
    textAlign: "center",
  },
  stepperValueDisabled: {
    color: "#666",
  },

  // ── Sound picker button (♪) ───────────────────────────────────────────────
  soundPickerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  soundPickerIcon: {
    color: yogaColors.instructionalText,
    fontSize: 16,
  },

  // ── Save-as-Pace button ───────────────────────────────────────────────────
  saveButton: {
    marginTop: 18,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: yogaColors.timerCountdown,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Toggle / spacer ───────────────────────────────────────────────────────
  toggle: {},
  // Same rendered width as a Switch so the ♪ column aligns in both rows
  toggleSpacer: {
    width: 51,
    height: 31,
  },

  // ── Sound picker modal ─────────────────────────────────────────────────────
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  pickerCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 20,
    minWidth: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  pickerTitle: {
    color: yogaColors.poseCurrentName,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    textAlign: "center",
  },
  // Each row: [radio + label] ... [▶]
  pickerOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  pickerSelectArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingVertical: 6,
  },
  pickerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: yogaColors.timerCountdown,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: yogaColors.timerCountdown,
  },
  pickerOptionLabel: {
    color: yogaColors.poseCurrentName,
    fontSize: 15,
  },
  // ▶ play button
  pickerPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  pickerPlayIcon: {
    color: yogaColors.timerCountdown,
    fontSize: 12,
    lineHeight: 14,
  },
  pickerDoneButton: {
    marginTop: 16,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  pickerDoneText: {
    color: yogaColors.timerCountdown,
    fontSize: 15,
    fontWeight: "600",
  },
});
