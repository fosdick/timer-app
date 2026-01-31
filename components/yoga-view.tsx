import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, Modal, StyleSheet } from "react-native";
import { TimerStyles, colorTheme, screenStyles } from "@/assets/styles/timer-app";
import {
  formatMinutesSeconds,
  getTimePartsMinSec,
} from "../assets/utils/format-time";
import { getData, storeData } from "../assets/utils/persistent-storage";
import { playStart, playYogaTransition, playHalfway } from "../assets/utils/sounds";
import YogaFlowSelect from "./yoga-flow-select";
import YogaAssetRenderer from "./yoga-asset-renderer";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { TimerPickerModal } from "react-native-timer-picker";
import {
  YogaFlow,
  YogaPose,
  YogaSuperset,
  isSuperset,
  getFlowById,
  getSupersetName,
  getSupersetDuration,
} from "@/assets/data/yoga-flows";
import { yogaColors, yogaTypography } from "@/assets/theme";

const YOGA_TIMER_APP_DATA = "yoga_timer_app_data";
const DEFAULT_INITIAL_TOTAL_TIME = 30;
const TRANSITION_DELAY_SECONDS = 5; // Delay between poses for transition

export default function YogaView() {
  // Flow state
  const [selectedFlow, setSelectedFlow] = useState<YogaFlow | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [currentPoseInSuperset, setCurrentPoseInSuperset] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(true); // Start in manual mode

  // Timer state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    DEFAULT_INITIAL_TOTAL_TIME,
  );
  const [initialTotalTime, setInitialTotalTime] = useState<number>(
    DEFAULT_INITIAL_TOTAL_TIME,
  );

  // Superset timer state
  const [supersetTimeRemaining, setSupersetTimeRemaining] = useState<number>(0);
  const [supersetTotalDuration, setSupersetTotalDuration] = useState<number>(0);

  // Transition delay state
  const [isInTransition, setIsInTransition] = useState<boolean>(false);
  const [transitionTimeRemaining, setTransitionTimeRemaining] = useState<number>(0);

  // Halfway chime state
  const [halfwayChimePlayed, setHalfwayChimePlayed] = useState<boolean>(false);

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
          const savedTime =
            savedData.yogaTotalInterval || DEFAULT_INITIAL_TOTAL_TIME;
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
      // FIX: Set to first POSE duration, not superset total
      // Calculate superset duration dynamically from poses
      const calculatedDuration = getSupersetDuration(firstItem);
      setTimeRemaining(firstItem.poses[0].duration);
      setSupersetTimeRemaining(calculatedDuration);
      setSupersetTotalDuration(calculatedDuration);
    } else {
      setTimeRemaining(firstItem.duration);
      setSupersetTimeRemaining(0);
      setSupersetTotalDuration(0);
    }
    setCurrentItemIndex(0);
    setCurrentPoseInSuperset(0);
    setHalfwayChimePlayed(false);
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
      if (!isRunning) return;

      // Handle transition delay countdown
      if (isInTransition) {
        if (transitionTimeRemaining > 1) {
          // Still in transition, keep counting down
          setTransitionTimeRemaining(transitionTimeRemaining - 1);
        } else {
          // Transition complete (was at 1, now ending), resume normal timer immediately
          setIsInTransition(false);
          setTransitionTimeRemaining(0);
        }
        return;
      }

      // Normal timer logic (only runs when NOT in transition)
      if (timeRemaining > 0) {
        // Check for halfway chime before decrementing
        if (!isManualMode && selectedFlow) {
          const currentItem = selectedFlow.items[currentItemIndex];
          let currentPose: YogaPose | null = null;
          let poseDuration = 0;

          if (isSuperset(currentItem)) {
            currentPose = currentItem.poses[currentPoseInSuperset];
            poseDuration = currentPose.duration;
          } else {
            currentPose = currentItem;
            poseDuration = currentItem.duration;
          }

          // Check if halfway chime is enabled (pose setting takes precedence)
          let chimeEnabled = false;
          if (currentPose.halfwayChime !== undefined) {
            chimeEnabled = currentPose.halfwayChime;
          } else if (isSuperset(currentItem) && currentItem.halfwayChime !== undefined) {
            chimeEnabled = currentItem.halfwayChime;
          }

          // Play chime at halfway point
          const halfwayPoint = Math.ceil(poseDuration / 2);
          if (chimeEnabled && !halfwayChimePlayed && timeRemaining === halfwayPoint) {
            playHalfway();
            setHalfwayChimePlayed(true);
          }
        }

        // Decrement the timer
        const newTime = timeRemaining - 1;
        setTimeRemaining(newTime);

        // Also decrement superset timer if we're in a superset
        if (supersetTimeRemaining > 0) {
          setSupersetTimeRemaining(supersetTimeRemaining - 1);
        }

        // If we just hit 0, advance to next pose immediately (no extra tick)
        if (newTime === 0) {
          if (isManualMode) {
            // Manual mode: just stop when timer reaches 0
            setIsRunning(false);
            playYogaTransition();
          } else if (selectedFlow) {
            // Flow mode: auto-advance to next pose
            advanceToNextPose();
          }
        }
      }
    }, 1000);

    return () => clearTimeout(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isRunning,
    timeRemaining,
    supersetTimeRemaining,
    selectedFlow,
    currentItemIndex,
    currentPoseInSuperset,
    isManualMode,
    halfwayChimePlayed,
    isInTransition,
    transitionTimeRemaining,
  ]);

  const advanceToNextPose = (useTransition: boolean = true) => {
    if (!selectedFlow) return;

    // Only play transition sound and delay for automatic advancement
    if (useTransition) {
      playYogaTransition();
      setIsInTransition(true);
      setTransitionTimeRemaining(TRANSITION_DELAY_SECONDS);
    }

    const currentItem = selectedFlow.items[currentItemIndex];

    // Check if we're in a superset and need to advance within it
    if (isSuperset(currentItem)) {
      const nextPoseIndex = currentPoseInSuperset + 1;
      if (nextPoseIndex < currentItem.poses.length) {
        // Move to next pose in superset
        setCurrentPoseInSuperset(nextPoseIndex);
        setTimeRemaining(currentItem.poses[nextPoseIndex].duration);
        setHalfwayChimePlayed(false); // Reset for new pose
        // Superset timer continues counting
        return;
      }
    }

    // Move to next item in flow
    const nextItemIndex = currentItemIndex + 1;
    if (nextItemIndex < selectedFlow.items.length) {
      const nextItem = selectedFlow.items[nextItemIndex];
      setCurrentItemIndex(nextItemIndex);
      setCurrentPoseInSuperset(0);
      setHalfwayChimePlayed(false); // Reset for new pose

      if (isSuperset(nextItem)) {
        // FIX: Set to first POSE duration, not superset total
        // Calculate superset duration dynamically from poses
        const calculatedDuration = getSupersetDuration(nextItem);
        setTimeRemaining(nextItem.poses[0].duration);
        setSupersetTimeRemaining(calculatedDuration);
        setSupersetTotalDuration(calculatedDuration);
      } else {
        setTimeRemaining(nextItem.duration);
        setSupersetTimeRemaining(0);
        setSupersetTotalDuration(0);
      }
    } else {
      // Flow complete
      setIsRunning(false);
      setHalfwayChimePlayed(false);
      initializeFirstPose(selectedFlow);
    }
  };

  const goToPreviousPose = () => {
    if (isManualMode || !selectedFlow) return;

    // Manual navigation - pause timer, no transition sound or delay
    setIsRunning(false);

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not first pose, go to previous in superset
    if (isSuperset(currentItem) && currentPoseInSuperset > 0) {
      const prevPoseIndex = currentPoseInSuperset - 1;
      setCurrentPoseInSuperset(prevPoseIndex);
      setTimeRemaining(currentItem.poses[prevPoseIndex].duration);
      setHalfwayChimePlayed(false); // Reset for new pose
      // Recalculate superset remaining time
      const remainingDuration = currentItem.poses
        .slice(prevPoseIndex)
        .reduce((sum, pose) => sum + pose.duration, 0);
      setSupersetTimeRemaining(remainingDuration);
      return;
    }

    // Otherwise go to previous item
    if (currentItemIndex > 0) {
      const prevItemIndex = currentItemIndex - 1;
      const prevItem = selectedFlow.items[prevItemIndex];
      setCurrentItemIndex(prevItemIndex);
      setHalfwayChimePlayed(false); // Reset for new pose

      if (isSuperset(prevItem)) {
        // Go to last pose in previous superset
        const calculatedDuration = getSupersetDuration(prevItem);
        setCurrentPoseInSuperset(prevItem.poses.length - 1);
        setTimeRemaining(prevItem.poses[prevItem.poses.length - 1].duration);
        setSupersetTimeRemaining(prevItem.poses[prevItem.poses.length - 1].duration);
        setSupersetTotalDuration(calculatedDuration);
      } else {
        setCurrentPoseInSuperset(0);
        setTimeRemaining(prevItem.duration);
        setSupersetTimeRemaining(0);
        setSupersetTotalDuration(0);
      }
    }
  };

  const goToNextPose = () => {
    if (isManualMode || !selectedFlow) return;
    // Manual navigation - pause timer, skip transition
    setIsRunning(false);
    advanceToNextPose(false);
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
      // Pause (preserve all state)
      setIsRunning(false);
    } else {
      // Start or Resume
      setIsRunning(true);
      // Only play start sound if starting from beginning
      if (isManualMode && timeRemaining === initialTotalTime) {
        playStart();
      } else if (!isManualMode && selectedFlow) {
        const firstItem = selectedFlow.items[0];
        const firstPoseDuration = isSuperset(firstItem) ? firstItem.poses[0].duration : firstItem.duration;
        if (currentItemIndex === 0 && currentPoseInSuperset === 0 && timeRemaining === firstPoseDuration) {
          playStart();
        }
      }
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

  // Get current, previous, and next poses for display with asset fallback logic
  const getCurrentPose = (): YogaPose | null => {
    if (isManualMode || !selectedFlow) return null;
    const currentItem = selectedFlow.items[currentItemIndex];
    if (isSuperset(currentItem)) {
      return currentItem.poses[currentPoseInSuperset];
    }
    return currentItem;
  };

  const getCurrentAssetId = (): string | undefined => {
    if (isManualMode || !selectedFlow) return undefined;
    const currentItem = selectedFlow.items[currentItemIndex];
    if (isSuperset(currentItem)) {
      const pose = currentItem.poses[currentPoseInSuperset];
      // Use pose's assetId if available, otherwise fall back to superset's assetId
      return pose.assetId || currentItem.assetId;
    }
    return currentItem.assetId;
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

  const getPreviousAssetId = (): string | undefined => {
    if (isManualMode || !selectedFlow) return undefined;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not first pose, get asset from previous pose in superset
    if (isSuperset(currentItem) && currentPoseInSuperset > 0) {
      const pose = currentItem.poses[currentPoseInSuperset - 1];
      return pose.assetId || currentItem.assetId;
    }

    // Otherwise get asset from previous item
    if (currentItemIndex > 0) {
      const prevItem = selectedFlow.items[currentItemIndex - 1];
      if (isSuperset(prevItem)) {
        const pose = prevItem.poses[prevItem.poses.length - 1];
        return pose.assetId || prevItem.assetId;
      }
      return prevItem.assetId;
    }

    return undefined;
  };

  const getNextPose = (): YogaPose | null => {
    if (isManualMode || !selectedFlow) return null;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not last pose, show next in superset
    if (
      isSuperset(currentItem) &&
      currentPoseInSuperset < currentItem.poses.length - 1
    ) {
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

  const getNextAssetId = (): string | undefined => {
    if (isManualMode || !selectedFlow) return undefined;

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not last pose, get asset from next pose in superset
    if (
      isSuperset(currentItem) &&
      currentPoseInSuperset < currentItem.poses.length - 1
    ) {
      const pose = currentItem.poses[currentPoseInSuperset + 1];
      return pose.assetId || currentItem.assetId;
    }

    // Otherwise get asset from next item
    if (currentItemIndex < selectedFlow.items.length - 1) {
      const nextItem = selectedFlow.items[currentItemIndex + 1];
      if (isSuperset(nextItem)) {
        const pose = nextItem.poses[0];
        return pose.assetId || nextItem.assetId;
      }
      return nextItem.assetId;
    }

    return undefined;
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
  const currentAssetId = getCurrentAssetId();
  const previousAssetId = getPreviousAssetId();
  const nextAssetId = getNextAssetId();
  const progressText = getProgressText();

  // Format current time
  const formatedTime: string = currentTime.toLocaleString("en-US", {
    timeStyle: "medium",
  });
  const [h, m, s, pam] = formatedTime.split(/:|\s/);

  return (
    <View style={screenStyles.contentContainer}>
      {/* Timer display - moved to top */}
      <View style={TimerStyles.vertBox}>
        <View style={TimerStyles.marginTop}>
          <Text style={styles.timerLabel}>Remaining</Text>
        </View>
        <TouchableOpacity
          activeOpacity={isManualMode ? 0.7 : 1}
          onPress={handleTimerPress}
          disabled={!isManualMode}
        >
          <Text style={styles.timerCountdown}>
            {formatMinutesSeconds(getTimePartsMinSec(timeRemaining))}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Flow name */}
      <View style={styles.flowNameContainer}>
        <Text style={styles.flowName}>
          {isManualMode
            ? "Manual Timer"
            : selectedFlow
              ? selectedFlow.name
              : "Select Flow"}
        </Text>
      </View>

      {/* Superset info - always reserve space, show content only when in superset */}
      {!isManualMode && selectedFlow && (
        <View style={styles.supersetInfoContainer}>
          {isSuperset(selectedFlow.items[currentItemIndex]) ? (
            <>
              <Text style={styles.supersetLabel}>
                {getSupersetName(selectedFlow.items[currentItemIndex] as YogaSuperset)} (pose {currentPoseInSuperset + 1} of {(selectedFlow.items[currentItemIndex] as YogaSuperset).poses.length} in superset)
              </Text>
              <Text style={styles.supersetTimer}>
                {formatMinutesSeconds(getTimePartsMinSec(supersetTimeRemaining))} remaining
              </Text>
            </>
          ) : (
            <View style={styles.supersetPlaceholder} />
          )}
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
              <YogaAssetRenderer
                assetId={previousAssetId}
                width={50}
                height={50}
                color={yogaColors.poseNavIcon}
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
              <YogaAssetRenderer
                assetId={currentAssetId}
                width={120}
                height={120}
                color={yogaColors.poseCurrentIcon}
                isPlaying={isRunning}
              />
            ) : (
              <YogaAssetRenderer
                assetId={undefined}
                width={120}
                height={120}
                color={yogaColors.poseNavIcon}
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
              <YogaAssetRenderer
                assetId={nextAssetId}
                width={50}
                height={50}
                color={yogaColors.poseNavIcon}
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
            <YogaAssetRenderer
              assetId={undefined}
              width={120}
              height={120}
              color={yogaColors.poseNavIcon}
              style={{ opacity: 0.3 }}
            />
          </TouchableOpacity>

          <View style={styles.sideIconContainer} />
        </View>
      )}

      {/* Pose name and description - fixed height container */}
      <View style={styles.poseInfoContainer}>
        {/* Progress text - always reserve space */}
        <View style={styles.progressTextContainer}>
          {progressText ? (
            <Text style={styles.progressText}>
              {progressText}{" "}
              <Text style={styles.progressTextLabel}>(Super Set)</Text>
            </Text>
          ) : (
            <View style={styles.progressTextPlaceholder} />
          )}
        </View>

        {currentPose ? (
          <>
            <Text style={styles.poseName}>{currentPose.name}</Text>
            {currentPose.description && (
              <Text style={styles.poseDescription}>
                {currentPose.description}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.poseInfoPlaceholder} />
        )}
      </View>

      {/* Current time */}
      <View style={TimerStyles.vertBox}>
        <Text style={styles.currentTimeLabel}>Current Time</Text>
        <Text style={styles.currentTime}>
          {h}:{m}:{s} <Text style={styles.currentTimePeriod}>{pam}</Text>
        </Text>
      </View>

      {/* Start/Stop/Resume button */}
      <View style={screenStyles.buttonContainer}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleStartStop}>
          <View>
            <Text style={TimerStyles.startButton}>
              {isRunning ? "Stop" : (timeRemaining > 0 && (isManualMode ? timeRemaining < initialTotalTime : true)) ? "Resume" : "Start"}
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
              <Text style={styles.pauseButtonText}>Reset</Text>
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
  // Layout
  flowContentArea: {
    flex: 1,
  },
  bottomSection: {
    marginTop: "auto",
  },

  // Timer Styles
  timerLabel: {
    ...yogaTypography.timerLabel,
  },
  timerCountdown: {
    ...yogaTypography.timerCountdown,
  },
  currentTimeLabel: {
    ...yogaTypography.currentTimeLabel,
  },
  currentTime: {
    ...yogaTypography.currentTime,
  },
  currentTimePeriod: {
    ...yogaTypography.currentTimePeriod,
  },

  // Flow Name
  flowNameContainer: {
    marginTop: 35,
    paddingHorizontal: 20,
  },
  flowName: {
    ...yogaTypography.flowName,
  },

  // Superset Info
  supersetInfoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center" as const,
    minHeight: 50, // Reserve space to prevent layout shift
  },
  supersetLabel: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: yogaColors.timerLabel,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  supersetTimer: {
    fontSize: 18,
    fontWeight: "300" as const,
    color: yogaColors.timerCountdown,
    textAlign: "center" as const,
  },
  supersetPlaceholder: {
    height: 50, // Match minHeight to maintain consistent spacing
  },

  // Progress Text
  progressTextContainer: {
    marginBottom: 10,
    paddingHorizontal: 30,
    minHeight: 30,
    justifyContent: "center",
  },
  progressText: {
    ...yogaTypography.progressText,
  },
  progressTextLabel: {
    ...yogaTypography.progressTextLabel,
  },
  progressTextPlaceholder: {
    height: 1,
  },

  // Pose Container
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
    opacity: yogaColors.poseNavIconOpacity,
  },
  centerIconContainer: {
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pose Info
  poseInfoContainer: {
    marginTop: 0,
    paddingHorizontal: 30,
    maxHeight: 180,
    minHeight: 180,
    overflow: "hidden",
  },
  poseInfoPlaceholder: {
    height: 1,
  },
  poseName: {
    ...yogaTypography.poseName,
    marginBottom: 8,
  },
  poseDescription: {
    ...yogaTypography.instructionalCues,
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
