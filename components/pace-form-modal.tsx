/**
 * PaceFormModal
 *
 * Create-or-edit form for a single Pace. Used by:
 *   - The Pace list's "+ Create new Pace" row (mode="create", defaults)
 *   - The hamburger Save-as-Pace button (mode="create", current values pre-filled)
 *   - The Pace list swipe-Edit action (mode="edit", existing pace values)
 *
 * The modal is stateful internally; on Save it emits the form's values
 * upward and the parent decides whether to addPace or updatePace.
 */

import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";

import {
  HALF_MARK_SOUNDS,
  PauseStepper,
  SoundPickerModal,
  TRANSITION_SOUNDS,
  stopPreviewSound,
  type HalfMarkSoundId,
  type TransitionSoundId,
} from "./timer-settings-panel";
import {
  formatMinutesSeconds,
  getTimePartsMinSec,
} from "../assets/utils/format-time";
import { yogaColors } from "@/assets/theme";
import type { TimerPaceInput } from "@/assets/data/yoga-paces";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaceFormModalProps {
  visible: boolean;
  mode: "create" | "edit";
  /** Values to seed the form with. Name may be "" for fresh creates. */
  initialValues: TimerPaceInput;
  onSave: (values: TimerPaceInput) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PaceFormModal = ({
  visible,
  mode,
  initialValues,
  onSave,
  onCancel,
}: PaceFormModalProps) => {
  const [name, setName] = useState(initialValues.name);
  const [initialTotalTime, setInitialTotalTime] = useState(
    initialValues.initialTotalTime,
  );
  const [transitionPauseMs, setTransitionPauseMs] = useState(
    initialValues.transitionPauseMs,
  );
  const [transitionSound, setTransitionSound] = useState<TransitionSoundId>(
    initialValues.transitionSound,
  );
  const [halfMarkPauseMs, setHalfMarkPauseMs] = useState(
    initialValues.halfMarkPauseMs,
  );
  const [halfMarkSound, setHalfMarkSound] = useState<HalfMarkSoundId>(
    initialValues.halfMarkSound,
  );
  const [halfMarkEnabled, setHalfMarkEnabled] = useState(
    initialValues.halfMarkEnabled,
  );

  // Reset internal state every time the modal is opened so a stale form
  // doesn't leak between create/edit invocations.
  useEffect(() => {
    if (visible) {
      setName(initialValues.name);
      setInitialTotalTime(initialValues.initialTotalTime);
      setTransitionPauseMs(initialValues.transitionPauseMs);
      setTransitionSound(initialValues.transitionSound);
      setHalfMarkPauseMs(initialValues.halfMarkPauseMs);
      setHalfMarkSound(initialValues.halfMarkSound);
      setHalfMarkEnabled(initialValues.halfMarkEnabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Sub-modals
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [showTransitionPicker, setShowTransitionPicker] = useState(false);
  const [showHalfMarkPicker, setShowHalfMarkPicker] = useState(false);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    stopPreviewSound();
    onSave({
      name: trimmedName,
      initialTotalTime,
      transitionPauseMs,
      transitionSound,
      halfMarkPauseMs,
      halfMarkSound,
      halfMarkEnabled,
    });
  };

  const handleCancel = () => {
    stopPreviewSound();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header — Cancel / Title / Save */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Text style={styles.headerAction}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "New Pace" : "Edit Pace"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.headerAction,
                styles.headerActionPrimary,
                !canSave && styles.headerActionDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g., morning slow long flow"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={60}
            returnKeyType="done"
          />
        </View>

        <View style={styles.rowDivider} />

        {/* Timer duration — tappable row, label left + value right */}
        <TouchableOpacity
          style={styles.timerRow}
          onPress={() => setShowTimerPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.fieldLabel}>Timer</Text>
          <Text style={styles.timerValue}>
            {formatMinutesSeconds(getTimePartsMinSec(initialTotalTime))}
          </Text>
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        {/* Main Transition — fixed-width label keeps stepper aligned with Half Mark.
            Trailing spacer matches the Half Mark switch column so ♪ aligns too. */}
        <View style={styles.settingRow}>
          <Text style={styles.fieldLabel}>Main Transition</Text>
          <View style={styles.settingControls}>
            <PauseStepper
              valueMs={transitionPauseMs}
              onChange={setTransitionPauseMs}
            />
            <TouchableOpacity
              style={styles.soundPickerButton}
              onPress={() => setShowTransitionPicker(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.soundPickerIcon}>♪</Text>
            </TouchableOpacity>
            <View style={styles.toggleSpacer} />
          </View>
        </View>

        <View style={styles.rowDivider} />

        {/* Half Mark */}
        <View style={styles.settingRow}>
          <Text style={styles.fieldLabel}>Half Mark</Text>
          <View style={styles.settingControls}>
            <PauseStepper
              valueMs={halfMarkPauseMs}
              onChange={setHalfMarkPauseMs}
            />
            <TouchableOpacity
              style={styles.soundPickerButton}
              onPress={() => setShowHalfMarkPicker(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.soundPickerIcon}>♪</Text>
            </TouchableOpacity>
            <Switch
              value={halfMarkEnabled}
              onValueChange={setHalfMarkEnabled}
              trackColor={{ false: "#555", true: yogaColors.timerCountdown }}
              thumbColor={halfMarkEnabled ? "#fff" : "#bbb"}
            />
          </View>
        </View>
      </View>

      {/* Timer picker (sub-modal) */}
      <TimerPickerModal
        visible={showTimerPicker}
        setIsVisible={setShowTimerPicker}
        initialValue={getTimePartsMinSec(initialTotalTime)}
        onConfirm={(picked) => {
          setInitialTotalTime(picked.minutes * 60 + picked.seconds);
          setShowTimerPicker(false);
        }}
        onCancel={() => setShowTimerPicker(false)}
        hideHours={true}
        modalTitle="Set Timer"
        closeOnOverlayPress
        LinearGradient={LinearGradient}
        styles={{ theme: "dark" }}
        modalProps={{ overlayOpacity: 0.2 }}
      />

      {/* Sound picker sub-modals */}
      <SoundPickerModal
        visible={showTransitionPicker}
        title="Transition Sound"
        options={TRANSITION_SOUNDS}
        selected={transitionSound}
        onSelect={setTransitionSound}
        onClose={() => {
          stopPreviewSound();
          setShowTransitionPicker(false);
        }}
      />
      <SoundPickerModal
        visible={showHalfMarkPicker}
        title="Half Mark Sound"
        options={HALF_MARK_SOUNDS}
        selected={halfMarkSound}
        onSelect={setHalfMarkSound}
        onClose={() => {
          stopPreviewSound();
          setShowHalfMarkPicker(false);
        }}
      />
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    color: yogaColors.poseCurrentName,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  headerAction: {
    color: yogaColors.instructionalText,
    fontSize: 16,
  },
  headerActionPrimary: {
    color: yogaColors.timerCountdown,
    fontWeight: "600",
  },
  headerActionDisabled: {
    color: "#555",
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginBottom: 8,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 8,
  },

  // Fields
  fieldGroup: {
    paddingVertical: 12,
  },
  fieldLabel: {
    color: yogaColors.poseCurrentName,
    fontSize: 15,
    width: 120, // matches hamburger panel — keeps stepper column aligned across rows
    marginRight: 8,
  },
  nameInput: {
    color: yogaColors.poseCurrentName,
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: "#262626",
    borderRadius: 8,
  },

  // Stepper rows (Main Transition / Half Mark) — label left, controls
  // flow naturally after it so stepper columns align across rows.
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  // Timer row — label left, value right (no stepper, so space-between is OK)
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Same rendered width as a Switch — keeps ♪ column aligned in the
  // Main Transition row even though it has no toggle.
  toggleSpacer: {
    width: 51,
    height: 31,
  },
  timerValue: {
    color: yogaColors.timerCountdown,
    fontSize: 18,
    fontWeight: "600",
  },

  // ♪ button (matches hamburger style)
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
});
