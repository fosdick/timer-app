import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Modal, StyleSheet } from "react-native";
import { TimerStyles, colorTheme } from "@/assets/styles/timer-app";
import { formatMinutesSeconds, getTimePartsMinSec } from "../assets/utils/format-time";
import { getData, storeData } from "../assets/utils/persistent-storage";
import { playStart, playYogaTransition } from "../assets/utils/sounds";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import YogaFlowSelect from "./yoga-flow-select";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  YogaFlow,
  YogaPose,
  isSuperset,
  getFlowById,
} from "@/assets/data/yoga-flows";

const YOGA_TIMER_APP_DATA = "yoga_timer_app_data";
const DEFAULT_INITIAL_TOTAL_TIME = 30;

export default function YogaView() {
  // Flow state
  const [selectedFlow, setSelectedFlow] = useState<YogaFlow | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [currentPoseInSuperset, setCurrentPoseInSuperset] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(true); // Start in manual mode

  // Timer state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_INITIAL_TOTAL_TIME);
  const [initialTotalTime, setInitialTotalTime] = useState<number>(DEFAULT_INITIAL_TOTAL_TIME);

  // UI state
  const [showFlowSelect, setShowFlowSelect] = useState<boolean>(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load saved flow on mount
  useEffect(() => {
    const loadSavedFlow = async () => {
      const savedData = await getData(YOGA_TIMER_APP_DATA);
      if (savedData?.selectedFlowId) {
        if (savedData.selectedFlowId === "manual") {
          setIsManualMode(true);
          setSelectedFlow(null);
          const savedTime = savedData.yogaTotalInterval || DEFAULT_INITIAL_TOTAL_TIME;
          setInitialTotalTime(savedTime);
          setTimeRemaining(savedTime);
        } else {
          const flow = getFlowById(savedData.selectedFlowId);
          if (flow) {
            setIsManualMode(false);
            setSelectedFlow(flow);
            initializeFirstPose(flow);
          }
        }
      }
    };
    loadSavedFlow();
  }, []);

  // Initialize first pose when flow is selected
  const initializeFirstPose = (flow: YogaFlow) => {
    const firstItem = flow.items[0];
    if (isSuperset(firstItem)) {
      setTimeRemaining(firstItem.totalDuration);
    } else {
      setTimeRemaining(firstItem.duration);
    }
    setCurrentItemIndex(0);
    setCurrentPoseInSuperset(0);
  };

  // Current time clock - always updates regardless of timer state
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Timer tick
  useEffect(() => {
    const intervalId = setTimeout(() => {
      if (isRunning && timeRemaining > 0) {
        setTimeRemaining(timeRemaining - 1);
      } else if (isRunning && timeRemaining === 0) {
        if (isManualMode) {
          // Manual mode: just stop when timer reaches 0
          setIsRunning(false);
          playYogaTransition();
        } else if (selectedFlow) {
          // Flow mode: auto-advance to next pose
          advanceToNextPose();
        }
      }
    }, 1000);

    return () => clearTimeout(intervalId);
  }, [isRunning, timeRemaining, selectedFlow, currentItemIndex, currentPoseInSuperset, isManualMode]);

  const advanceToNextPose = () => {
    if (!selectedFlow) return;

    const currentItem = selectedFlow.items[currentItemIndex];

    // Check if we're in a superset and need to advance within it
    if (isSuperset(currentItem)) {
      const nextPoseIndex = currentPoseInSuperset + 1;
      if (nextPoseIndex < currentItem.poses.length) {
        // Move to next pose in superset
        setCurrentPoseInSuperset(nextPoseIndex);
        setTimeRemaining(currentItem.poses[nextPoseIndex].duration);
        playYogaTransition();
        return;
      }
    }

    // Move to next item in flow
    const nextItemIndex = currentItemIndex + 1;
    if (nextItemIndex < selectedFlow.items.length) {
      const nextItem = selectedFlow.items[nextItemIndex];
      setCurrentItemIndex(nextItemIndex);
      setCurrentPoseInSuperset(0);

      if (isSuperset(nextItem)) {
        setTimeRemaining(nextItem.totalDuration);
      } else {
        setTimeRemaining(nextItem.duration);
      }

      playYogaTransition();
    } else {
      // Flow complete
      setIsRunning(false);
      initializeFirstPose(selectedFlow);
      playYogaTransition();
    }
  };

  const goToPreviousPose = () => {
    if (isManualMode || !selectedFlow) return;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not first pose, go to previous in superset
    if (isSuperset(currentItem) && currentPoseInSuperset > 0) {
      const prevPoseIndex = currentPoseInSuperset - 1;
      setCurrentPoseInSuperset(prevPoseIndex);
      setTimeRemaining(currentItem.poses[prevPoseIndex].duration);
      return;
    }

    // Otherwise go to previous item
    if (currentItemIndex > 0) {
      const prevItemIndex = currentItemIndex - 1;
      const prevItem = selectedFlow.items[prevItemIndex];
      setCurrentItemIndex(prevItemIndex);

      if (isSuperset(prevItem)) {
        // Go to last pose in previous superset
        setCurrentPoseInSuperset(prevItem.poses.length - 1);
        setTimeRemaining(prevItem.poses[prevItem.poses.length - 1].duration);
      } else {
        setCurrentPoseInSuperset(0);
        setTimeRemaining(prevItem.duration);
      }
    }
  };

  const goToNextPose = () => {
    if (isManualMode || !selectedFlow) return;
    advanceToNextPose();
  };

  const handleSelectFlow = (flow: YogaFlow) => {
    setSelectedFlow(flow);
    setIsManualMode(false);
    setShowFlowSelect(false);
    setIsRunning(false);
    initializeFirstPose(flow);

    // Save to storage
    storeData(YOGA_TIMER_APP_DATA, {
      selectedFlowId: flow.id,
    });
  };

  const handleSelectManual = () => {
    setIsManualMode(true);
    setSelectedFlow(null);
    setShowFlowSelect(false);
    setIsRunning(false);
    setTimeRemaining(initialTotalTime);

    // Save to storage
    storeData(YOGA_TIMER_APP_DATA, {
      selectedFlowId: "manual",
      yogaTotalInterval: initialTotalTime,
    });
  };

  const handleCenterIconPress = () => {
    if (isRunning) {
      // Pause and show overlay
      setIsRunning(false);
      setShowPauseOverlay(true);
    } else {
      // Open flow select
      setShowFlowSelect(true);
    }
  };

  const handleTimerPress = () => {
    // Only allow timer click in manual mode or when no flow selected
    if (isManualMode) {
      setShowPicker(true);
    }
  };

  const handleStartStop = () => {
    if (isRunning) {
      // Stop
      setIsRunning(false);
      if (isManualMode) {
        setTimeRemaining(initialTotalTime);
      } else if (selectedFlow) {
        initializeFirstPose(selectedFlow);
      }
    } else {
      // Start
      setIsRunning(true);
      playStart();
    }
  };

  const handleResume = () => {
    setShowPauseOverlay(false);
    setIsRunning(true);
  };

  const handleStopFromPause = () => {
    setShowPauseOverlay(false);
    setIsRunning(false);
    if (isManualMode) {
      setTimeRemaining(initialTotalTime);
    } else if (selectedFlow) {
      initializeFirstPose(selectedFlow);
    }
  };

  const handleSelectDifferentFlow = () => {
    setShowPauseOverlay(false);
    setIsRunning(false);
    setShowFlowSelect(true);
  };

  // Get current, previous, and next poses for display
  const getCurrentPose = (): YogaPose | null => {
    if (isManualMode || !selectedFlow) return null;
    const currentItem = selectedFlow.items[currentItemIndex];
    if (isSuperset(currentItem)) {
      return currentItem.poses[currentPoseInSuperset];
    }
    return currentItem;
  };

  const getPreviousPose = (): YogaPose | null => {
    if (isManualMode || !selectedFlow) return null;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not first pose, show previous in superset
    if (isSuperset(currentItem) && currentPoseInSuperset > 0) {
      return currentItem.poses[currentPoseInSuperset - 1];
    }

    // Otherwise show previous item
    if (currentItemIndex > 0) {
      const prevItem = selectedFlow.items[currentItemIndex - 1];
      if (isSuperset(prevItem)) {
        return prevItem.poses[prevItem.poses.length - 1]; // Last pose of previous superset
      }
      return prevItem;
    }

    return null;
  };

  const getNextPose = (): YogaPose | null => {
    if (isManualMode || !selectedFlow) return null;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not last pose, show next in superset
    if (isSuperset(currentItem) && currentPoseInSuperset < currentItem.poses.length - 1) {
      return currentItem.poses[currentPoseInSuperset + 1];
    }

    // Otherwise show next item
    if (currentItemIndex < selectedFlow.items.length - 1) {
      const nextItem = selectedFlow.items[currentItemIndex + 1];
      if (isSuperset(nextItem)) {
        return nextItem.poses[0]; // First pose of next superset
      }
      return nextItem;
    }

    return null;
  };

  const getProgressText = (): string | null => {
    if (isManualMode || !selectedFlow) return null;

    const currentItem = selectedFlow.items[currentItemIndex];

    // Use custom progress text if available
    if (isSuperset(currentItem) && currentItem.progressText) {
      return currentItem.progressText;
    }

    const currentPose = getCurrentPose();
    if (currentPose?.progressText) {
      return currentPose.progressText;
    }

    return null;
  };

  const currentPose = getCurrentPose();
  const previousPose = getPreviousPose();
  const nextPose = getNextPose();
  const progressText = getProgressText();

  // Format current time
  const formatedTime: string = currentTime.toLocaleString("en-US", {
    timeStyle: "medium",
  });
  const [h, m, s, pam] = formatedTime.split(/:|\s/);

  return (
    <View style={TimerStyles.vertBox}>
      {/* Timer display - moved to top */}
      <View style={TimerStyles.vertBox}>
        <View style={TimerStyles.marginTop}>
          <Text style={TimerStyles.valueText}>Remaining</Text>
        </View>
        <TouchableOpacity
          activeOpacity={isManualMode ? 0.7 : 1}
          onPress={handleTimerPress}
          disabled={!isManualMode}
        >
          <Text style={TimerStyles.timerFace}>
            {formatMinutesSeconds(getTimePartsMinSec(timeRemaining))}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Flow name */}
      <View style={styles.flowNameContainer}>
        <Text style={styles.flowName}>
          {isManualMode ? "Manual Timer" : selectedFlow ? selectedFlow.name : "Select Flow"}
        </Text>
      </View>

      {/* Progress text */}
      {progressText && (
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>
      )}

      {/* Horizontal pose layout - only show if not in manual mode */}
      {!isManualMode && (
        <View style={styles.poseContainer}>
          {/* Previous pose icon (clickable if exists) */}
          <TouchableOpacity
            style={styles.sideIconContainer}
            activeOpacity={previousPose ? 0.7 : 1}
            onPress={previousPose ? goToPreviousPose : undefined}
            disabled={!previousPose}
          >
            {previousPose && (
              <YogaSvg
                width={50}
                height={50}
                color={colorTheme.fontColor}
                style={styles.sideIcon}
              />
            )}
          </TouchableOpacity>

          {/* Current pose icon (clickable) */}
          <TouchableOpacity
            style={styles.centerIconContainer}
            activeOpacity={0.7}
            onPress={handleCenterIconPress}
          >
            {currentPose ? (
              <YogaSvg
                width={120}
                height={120}
                color={colorTheme.borderColor}
              />
            ) : (
              <YogaSvg
                width={120}
                height={120}
                color={colorTheme.fontColor}
                style={{ opacity: 0.3 }}
              />
            )}
          </TouchableOpacity>

          {/* Next pose icon (clickable if exists) */}
          <TouchableOpacity
            style={styles.sideIconContainer}
            activeOpacity={nextPose ? 0.7 : 1}
            onPress={nextPose ? goToNextPose : undefined}
            disabled={!nextPose}
          >
            {nextPose && (
              <YogaSvg
                width={50}
                height={50}
                color={colorTheme.fontColor}
                style={styles.sideIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Manual mode - show center icon with select flow functionality */}
      {isManualMode && (
        <View style={styles.poseContainer}>
          <View style={styles.sideIconContainer} />

          <TouchableOpacity
            style={styles.centerIconContainer}
            activeOpacity={0.7}
            onPress={handleCenterIconPress}
          >
            <YogaSvg
              width={120}
              height={120}
              color={colorTheme.fontColor}
              style={{ opacity: 0.3 }}
            />
          </TouchableOpacity>

          <View style={styles.sideIconContainer} />
        </View>
      )}

      {/* Pose name and description */}
      {currentPose && (
        <View style={styles.poseInfoContainer}>
          <Text style={styles.poseName}>{currentPose.name}</Text>
          {currentPose.description && (
            <Text style={styles.poseDescription}>{currentPose.description}</Text>
          )}
        </View>
      )}

      {/* Current time */}
      <View style={TimerStyles.vertBox}>
        <Text style={TimerStyles.valueText}>Current Time</Text>
        <Text style={TimerStyles.timerFaceSmall}>
          {h}:{m}:{s} <Text style={TimerStyles.small}>{pam}</Text>
        </Text>
      </View>

      {/* Start/Stop button */}
      <View style={[TimerStyles.vertBox, { alignSelf: "baseline", marginBottom: 32 }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleStartStop}>
          <View style={TimerStyles.marginTop}>
            <Text style={TimerStyles.startButton}>
              {isRunning ? "Stop" : "Start"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Flow Select Modal */}
      <Modal
        visible={showFlowSelect}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFlowSelect(false)}
      >
        <View style={styles.modalContainer}>
          <YogaFlowSelect
            onSelectFlow={handleSelectFlow}
            onSelectManual={handleSelectManual}
            onCancel={() => setShowFlowSelect(false)}
          />
        </View>
      </Modal>

      {/* Pause Overlay Modal */}
      <Modal
        visible={showPauseOverlay}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPauseOverlay(false)}
      >
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseMenu}>
            <TouchableOpacity
              style={styles.pauseButton}
              activeOpacity={0.7}
              onPress={handleResume}
            >
              <Text style={styles.pauseButtonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pauseButton}
              activeOpacity={0.7}
              onPress={handleStopFromPause}
            >
              <Text style={styles.pauseButtonText}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pauseButton}
              activeOpacity={0.7}
              onPress={handleSelectDifferentFlow}
            >
              <Text style={styles.pauseButtonText}>Select Different Flow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Timer Picker Modal - for manual mode */}
      <TimerPickerModal
        visible={showPicker}
        setIsVisible={setShowPicker}
        initialValue={getTimePartsMinSec(initialTotalTime)}
        onConfirm={(pickedDuration) => {
          const newTime = pickedDuration.minutes * 60 + pickedDuration.seconds;
          setInitialTotalTime(newTime);
          setTimeRemaining(newTime);
          setShowPicker(false);
          setIsRunning(false);

          // Save to storage
          storeData(YOGA_TIMER_APP_DATA, {
            selectedFlowId: "manual",
            yogaTotalInterval: newTime,
          });
        }}
        hideHours={true}
        modalTitle="Set Timer"
        onCancel={() => setShowPicker(false)}
        closeOnOverlayPress
        Audio={Audio}
        LinearGradient={LinearGradient}
        styles={{
          theme: "dark",
        }}
        modalProps={{
          overlayOpacity: 0.2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flowNameContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  flowName: {
    fontSize: 24,
    fontWeight: "600",
    color: colorTheme.fontColor,
    textAlign: "center",
  },
  progressTextContainer: {
    marginTop: 10,
    paddingHorizontal: 30,
  },
  progressText: {
    fontSize: 14,
    color: colorTheme.fontColor,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  poseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sideIconContainer: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  sideIcon: {
    opacity: 0.5,
  },
  centerIconContainer: {
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  poseInfoContainer: {
    marginTop: 20,
    paddingHorizontal: 30,
  },
  poseName: {
    fontSize: 20,
    fontWeight: "500",
    color: colorTheme.fontColor,
    textAlign: "center",
    marginBottom: 8,
  },
  poseDescription: {
    fontSize: 16,
    color: colorTheme.fontColor,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colorTheme.backgroundColor,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseMenu: {
    backgroundColor: colorTheme.backgroundColor,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: colorTheme.borderColor,
  },
  pauseButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colorTheme.borderColor,
    marginBottom: 12,
  },
  pauseButtonText: {
    fontSize: 18,
    color: colorTheme.fontColor,
    textAlign: "center",
  },
});
