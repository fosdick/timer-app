import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View, Modal, StyleSheet } from "react-native";
import { TimerStyles, colorTheme, screenStyles } from "@/assets/styles/timer-app";
import {
  formatMinutesSeconds,
  getTimePartsMinSec,
} from "../assets/utils/format-time";
import { getData, storeData } from "../assets/utils/persistent-storage";

import YogaFlowSelect from "./yoga-flow-select";
import YogaAssetRenderer from "./yoga-asset-renderer";
import { HamburgerSvg } from "@/assets/images/svgx/hamburger";
import {
  TimerSettingsPanel,
  type TransitionSoundId,
  type HalfMarkSoundId,
} from "./timer-settings-panel";
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
} from "@/assets/data/yoga-flows";
import { yogaColors, yogaTypography } from "@/assets/theme";
import { useFocusEffect } from "expo-router";
import { YOGA_FLOW_ENABLED } from "@/constants/constants";
import { PaceListModal } from "./pace-list-modal";
import { PaceFormModal } from "./pace-form-modal";
import {
  type TimerPace,
  type TimerPaceInput,
  addPace,
  deletePace,
  loadActivePaceId,
  loadPaces,
  saveActivePaceId,
  updatePace,
} from "@/assets/data/yoga-paces";

const YOGA_TIMER_APP_DATA = "yoga_timer_app_data";
const YOGA_TIMER_SETTINGS_DATA = "yoga_timer_settings_data";
const DEFAULT_INITIAL_TOTAL_TIME = 30;
const DEFAULT_TRANSITION_PAUSE_MS = 5000; // 5 s default for Main Transition
const DEFAULT_HALF_MARK_PAUSE_MS  = 1000; // 1 s default for Half Mark

/* eslint-disable @typescript-eslint/no-var-requires */
const TRANSITION_SOUND_REQUIRE: Record<string, unknown> = {
  swoosh:    require("../assets/sounds/733936__creator_gt__swoosh-04.wav"),
  "end-bell": require("../assets/sounds/end-bell.wav"),
  ocean:     require("../assets/sounds/442944__qubodup__ocean-wave.wav"),
};
const HALF_MARK_SOUND_REQUIRE: Record<string, unknown> = {
  sticks: require("../assets/sounds/sticks-low-1.wav"),
  snap:   require("../assets/sounds/snap.wav"),
  bell:   require("../assets/sounds/350548__fairhavencollection__bell-hit.wav"),
};
/* eslint-enable @typescript-eslint/no-var-requires */


export default function YogaView() {
  // Flow state
  const [selectedFlow, setSelectedFlow] = useState<YogaFlow | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [currentPoseInSuperset, setCurrentPoseInSuperset] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(true); // Start in manual mode
  const [durationMultiplier, setDurationMultiplier] = useState<number>(1);

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

  // Transition delay state (timing driven by transitionTimeoutRef, not a ticker)
  const [isInTransition, setIsInTransition] = useState<boolean>(false);

  // Halfway chime state
  const [halfwayChimePlayed, setHalfwayChimePlayed] = useState<boolean>(false);
  // True while the timer is in an automatic halfway-chime pause.
  // Keeps the Start/Stop button showing "Stop" so the user isn't confused.
  const [isAutoTimerPaused, setIsAutoTimerPaused] = useState<boolean>(false);
  // Ref for the post-halfway-chime pause timeout (cancelable on manual stop)
  const halfwayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop any currently-playing timer sound (fire-and-forget; errors swallowed).
  const stopTimerSound = () => {
    if (currentTimerSoundRef.current) {
      const s = currentTimerSoundRef.current;
      currentTimerSoundRef.current = null;
      s.stopAsync().catch(() => {}).finally(() => s.unloadAsync().catch(() => {}));
    }
  };

  // Stop the previous timer sound, then create and play the new one.
  // Stores a ref so the sound can be stopped before it finishes naturally.
  const playTimerSound = (requireResult: unknown) => {
    stopTimerSound();
    const play = async () => {
      const { sound } = await Audio.Sound.createAsync(
        requireResult as Parameters<typeof Audio.Sound.createAsync>[0],
      );
      currentTimerSoundRef.current = sound;
      await sound.playAsync();
    };
    play();
  };

  // Cancel any in-flight halfway-pause timeout and stop the timer.
  // Call this wherever the user explicitly stops or resets the timer so the
  // scheduled setIsRunning(true) can't fire unexpectedly.
  const cancelHalfwayPauseAndStop = () => {
    if (halfwayTimeoutRef.current !== null) {
      clearTimeout(halfwayTimeoutRef.current);
      halfwayTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    stopTimerSound();
    setIsAutoTimerPaused(false);
    setIsInTransition(false);
    setIsRunning(false);
  };

  // UI state
  const [showFlowSelect, setShowFlowSelect] = useState<boolean>(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState<boolean>(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [showTimerSettings, setShowTimerSettings] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pace state
  const [paces, setPaces] = useState<TimerPace[]>([]);
  const [activePaceId, setActivePaceId] = useState<string | null>(null);
  const [showPaceList, setShowPaceList] = useState<boolean>(false);
  const [paceFormVisible, setPaceFormVisible] = useState<boolean>(false);
  const [paceFormMode, setPaceFormMode] = useState<"create" | "edit">("create");
  const [paceFormInitial, setPaceFormInitial] = useState<TimerPaceInput | null>(
    null,
  );
  const [editingPaceId, setEditingPaceId] = useState<string | null>(null);

  // Timer settings panel state
  const [transitionPauseMs, setTransitionPauseMs] = useState<number>(DEFAULT_TRANSITION_PAUSE_MS);
  const [transitionSound, setTransitionSound] = useState<TransitionSoundId>("swoosh");
  const [halfMarkPauseMs, setHalfMarkPauseMs] = useState<number>(DEFAULT_HALF_MARK_PAUSE_MS);
  const [halfMarkSound, setHalfMarkSound] = useState<HalfMarkSoundId>("sticks");
  const [halfMarkEnabled, setHalfMarkEnabled] = useState<boolean>(true);

  // Refs so the timer effect can read the latest values without being in its dep array
  const transitionSoundRef    = useRef<TransitionSoundId>(transitionSound);
  const transitionPauseMsRef  = useRef<number>(transitionPauseMs);
  const halfMarkSoundRef      = useRef<HalfMarkSoundId>(halfMarkSound);
  const halfMarkPauseMsRef    = useRef<number>(halfMarkPauseMs);
  const halfMarkEnabledRef    = useRef<boolean>(halfMarkEnabled);

  // Cancelable timeout refs (transition pause + halfway-chime pause)
  const transitionTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the currently-playing timer sound so it can be stopped on demand
  const currentTimerSoundRef  = useRef<Audio.Sound | null>(null);

  // When true the save effect is allowed to run — flips after the initial load
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Helper to scale duration by multiplier (minimum 1 second)
  const getScaledDuration = (duration: number, multiplier: number = durationMultiplier) =>
    Math.max(1, Math.round(duration * multiplier));

  const getScaledSupersetDuration = (superset: YogaSuperset, multiplier: number = durationMultiplier) =>
    superset.poses.reduce((sum, pose) => sum + Math.max(1, Math.round(pose.duration * multiplier)), 0);

  // Keep refs in sync so the timer effect always uses the latest settings
  useEffect(() => { transitionSoundRef.current   = transitionSound;   }, [transitionSound]);
  useEffect(() => { transitionPauseMsRef.current = transitionPauseMs; }, [transitionPauseMs]);
  useEffect(() => { halfMarkSoundRef.current     = halfMarkSound;     }, [halfMarkSound]);
  useEffect(() => { halfMarkPauseMsRef.current   = halfMarkPauseMs;   }, [halfMarkPauseMs]);
  useEffect(() => { halfMarkEnabledRef.current   = halfMarkEnabled;   }, [halfMarkEnabled]);

  // Load persisted timer settings on mount (durations + toggle; sounds intentionally not persisted)
  useEffect(() => {
    const loadSavedSettings = async () => {
      const saved = await getData(YOGA_TIMER_SETTINGS_DATA);
      if (saved?.transitionPauseMs !== undefined) setTransitionPauseMs(saved.transitionPauseMs);
      if (saved?.halfMarkPauseMs   !== undefined) setHalfMarkPauseMs(saved.halfMarkPauseMs);
      if (saved?.halfMarkEnabled   !== undefined) setHalfMarkEnabled(saved.halfMarkEnabled);
      if (saved?.transitionSound   !== undefined) setTransitionSound(saved.transitionSound as TransitionSoundId);
      if (saved?.halfMarkSound     !== undefined) setHalfMarkSound(saved.halfMarkSound as HalfMarkSoundId);
      setSettingsLoaded(true); // triggers re-render so the save effect can fire
    };
    loadSavedSettings();
  }, []);

  // Persist timer settings whenever they change.
  // settingsLoaded in the dep array means this also fires the moment load finishes,
  // capturing any change the user made before the async load returned.
  useEffect(() => {
    if (!settingsLoaded) return;
    storeData(YOGA_TIMER_SETTINGS_DATA, { transitionPauseMs, halfMarkPauseMs, halfMarkEnabled, transitionSound, halfMarkSound });
  }, [settingsLoaded, transitionPauseMs, halfMarkPauseMs, halfMarkEnabled, transitionSound, halfMarkSound]);

  // Load paces + restore last-active pace on mount.
  // Runs after settings load so the active pace's values cleanly override
  // any persisted hamburger settings (pace wins).
  useEffect(() => {
    if (!settingsLoaded) return;
    const loadPacesAndActive = async () => {
      const [pacesList, activeId] = await Promise.all([
        loadPaces(),
        loadActivePaceId(),
      ]);
      setPaces(pacesList);
      if (activeId) {
        const active = pacesList.find((p) => p.id === activeId);
        if (active) {
          // Inline-apply so we don't depend on a const declared further down
          setInitialTotalTime(active.initialTotalTime);
          setTimeRemaining(active.initialTotalTime);
          setTransitionPauseMs(active.transitionPauseMs);
          setTransitionSound(active.transitionSound);
          setHalfMarkPauseMs(active.halfMarkPauseMs);
          setHalfMarkSound(active.halfMarkSound);
          setHalfMarkEnabled(active.halfMarkEnabled);
          setActivePaceId(active.id);
        } else {
          // Stale id (pace was deleted in another session) — clear it
          saveActivePaceId(null);
        }
      }
    };
    loadPacesAndActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

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
            const savedMultiplier = savedData.durationMultiplier || 1;
            setDurationMultiplier(savedMultiplier);
            setIsManualMode(false);
            setSelectedFlow(flow);
            initializeFirstPose(flow, savedMultiplier);
          }
        }
      }
    };
    loadSavedFlow();
  }, []);

  // Initialize first pose when flow is selected
  const initializeFirstPose = (flow: YogaFlow, multiplier?: number) => {
    const mult = multiplier !== undefined ? multiplier : durationMultiplier;
    const firstItem = flow.items[0];
    if (isSuperset(firstItem)) {
      const scaledPoseDuration = getScaledDuration(firstItem.poses[0].duration, mult);
      const scaledTotal = getScaledSupersetDuration(firstItem, mult);
      setTimeRemaining(scaledPoseDuration);
      setSupersetTimeRemaining(scaledTotal);
      setSupersetTotalDuration(scaledTotal);
    } else {
      setTimeRemaining(getScaledDuration(firstItem.duration, mult));
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

  // Stop timer and all sounds whenever this screen loses focus.
  // Covers: tab switches to Pranayama/HITT, and navigating to Settings.
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Clear both cancelable timeouts
        if (halfwayTimeoutRef.current !== null) {
          clearTimeout(halfwayTimeoutRef.current);
          halfwayTimeoutRef.current = null;
        }
        if (transitionTimeoutRef.current !== null) {
          clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = null;
        }
        // Stop any playing sound
        if (currentTimerSoundRef.current) {
          const s = currentTimerSoundRef.current;
          currentTimerSoundRef.current = null;
          s.stopAsync().catch(() => {}).finally(() => s.unloadAsync().catch(() => {}));
        }
        // Reset all running/paused flags
        setIsAutoTimerPaused(false);
        setIsInTransition(false);
        setIsRunning(false);
      };
    }, []),
  );

  // Timer tick
  useEffect(() => {
    const intervalId = setTimeout(() => {
      if (!isRunning) return;

      // Transition is timed by transitionTimeoutRef — just hold here until it fires
      if (isInTransition) return;

      // Normal timer logic (only runs when NOT in transition)
      if (timeRemaining > 0) {
        // Manual mode halfway chime — gated by the Half Mark toggle
        if (isManualMode && halfMarkEnabledRef.current) {
          const halfwayPoint = Math.ceil(initialTotalTime / 2);
          if (!halfwayChimePlayed && timeRemaining === halfwayPoint) {
            playTimerSound(HALF_MARK_SOUND_REQUIRE[halfMarkSoundRef.current]);
            setHalfwayChimePlayed(true);
            // Pause briefly so the chime isn't buried by an immediate decrement.
            // isAutoTimerPaused keeps the button showing "Stop" during the pause.
            setIsRunning(false);
            setIsAutoTimerPaused(true);
            halfwayTimeoutRef.current = setTimeout(() => {
              stopTimerSound();        // cut the sound when the pause ends
              setIsAutoTimerPaused(false);
              setIsRunning(true);
            }, halfMarkPauseMsRef.current);
            return; // skip decrement this tick
          }
        }

        // Flow mode halfway chime
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

          // Play chime at halfway point (using scaled duration)
          const scaledDuration = getScaledDuration(poseDuration);
          const halfwayPoint = Math.ceil(scaledDuration / 2);
          if (chimeEnabled && halfMarkEnabledRef.current && !halfwayChimePlayed && timeRemaining === halfwayPoint) {
            playTimerSound(HALF_MARK_SOUND_REQUIRE[halfMarkSoundRef.current]);
            setHalfwayChimePlayed(true);
            // Pause briefly so the chime lands cleanly on the halfway second.
            setIsRunning(false);
            setIsAutoTimerPaused(true);
            halfwayTimeoutRef.current = setTimeout(() => {
              stopTimerSound();        // cut the sound when the pause ends
              setIsAutoTimerPaused(false);
              setIsRunning(true);
            }, halfMarkPauseMsRef.current);
            return; // skip decrement this tick
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
            // Manual mode: play sound, pause for transitionPauseMs, then repeat
            playTimerSound(TRANSITION_SOUND_REQUIRE[transitionSoundRef.current]);
            setIsInTransition(true);
            transitionTimeoutRef.current = setTimeout(() => {
              transitionTimeoutRef.current = null;
              setIsInTransition(false);
              setTimeRemaining(initialTotalTime);
              setHalfwayChimePlayed(false);
            }, transitionPauseMsRef.current);
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
    durationMultiplier,
  ]);

  const advanceToNextPose = (useTransition: boolean = true) => {
    if (!selectedFlow) return;

    // Only play transition sound and delay for automatic advancement
    if (useTransition) {
      playTimerSound(TRANSITION_SOUND_REQUIRE[transitionSoundRef.current]);
      setIsInTransition(true);
      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null;
        setIsInTransition(false);
      }, transitionPauseMsRef.current);
    }

    const currentItem = selectedFlow.items[currentItemIndex];

    // Check if we're in a superset and need to advance within it
    if (isSuperset(currentItem)) {
      const nextPoseIndex = currentPoseInSuperset + 1;
      if (nextPoseIndex < currentItem.poses.length) {
        // Move to next pose in superset
        setCurrentPoseInSuperset(nextPoseIndex);
        setTimeRemaining(getScaledDuration(currentItem.poses[nextPoseIndex].duration));
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
        const scaledTotal = getScaledSupersetDuration(nextItem);
        setTimeRemaining(getScaledDuration(nextItem.poses[0].duration));
        setSupersetTimeRemaining(scaledTotal);
        setSupersetTotalDuration(scaledTotal);
      } else {
        setTimeRemaining(getScaledDuration(nextItem.duration));
        setSupersetTimeRemaining(0);
        setSupersetTotalDuration(0);
      }
    } else {
      // Flow complete
      cancelHalfwayPauseAndStop();
      setHalfwayChimePlayed(false);
      initializeFirstPose(selectedFlow);
    }
  };

  const goToPreviousPose = () => {
    if (isManualMode || !selectedFlow) return;

    // Manual navigation - pause timer, no transition sound or delay
    cancelHalfwayPauseAndStop();

    const currentItem = selectedFlow.items[currentItemIndex];

    // If in superset and not first pose, go to previous in superset
    if (isSuperset(currentItem) && currentPoseInSuperset > 0) {
      const prevPoseIndex = currentPoseInSuperset - 1;
      setCurrentPoseInSuperset(prevPoseIndex);
      setTimeRemaining(getScaledDuration(currentItem.poses[prevPoseIndex].duration));
      setHalfwayChimePlayed(false); // Reset for new pose
      // Recalculate superset remaining time
      const remainingDuration = currentItem.poses
        .slice(prevPoseIndex)
        .reduce((sum, pose) => sum + getScaledDuration(pose.duration), 0);
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
        const calculatedDuration = getScaledSupersetDuration(prevItem);
        setCurrentPoseInSuperset(prevItem.poses.length - 1);
        setTimeRemaining(getScaledDuration(prevItem.poses[prevItem.poses.length - 1].duration));
        setSupersetTimeRemaining(getScaledDuration(prevItem.poses[prevItem.poses.length - 1].duration));
        setSupersetTotalDuration(calculatedDuration);
      } else {
        setCurrentPoseInSuperset(0);
        setTimeRemaining(getScaledDuration(prevItem.duration));
        setSupersetTimeRemaining(0);
        setSupersetTotalDuration(0);
      }
    }
  };

  const goToNextPose = () => {
    if (isManualMode || !selectedFlow) return;
    // Manual navigation - pause timer, skip transition
    cancelHalfwayPauseAndStop();
    advanceToNextPose(false);
  };

  const handleSelectFlow = (flow: YogaFlow, multiplier: number = 1) => {
    setDurationMultiplier(multiplier);
    setSelectedFlow(flow);
    setIsManualMode(false);
    setShowFlowSelect(false);
    cancelHalfwayPauseAndStop();
    initializeFirstPose(flow, multiplier);

    // Save to storage
    storeData(YOGA_TIMER_APP_DATA, {
      selectedFlowId: flow.id,
      durationMultiplier: multiplier,
    });
  };

  const handleSelectManual = () => {
    setIsManualMode(true);
    setSelectedFlow(null);
    setShowFlowSelect(false);
    cancelHalfwayPauseAndStop();
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
      cancelHalfwayPauseAndStop();
      setShowPauseOverlay(true);
    } else {
      // Open Pace list (replaces yoga-flow select while YOGA_FLOW_ENABLED is off)
      setShowPaceList(true);
    }
  };

  const handleTimerPress = () => {
    // Only allow timer click in manual mode or when no flow selected
    if (isManualMode) {
      setShowPicker(true);
    }
  };

  const handleStartStop = () => {
    if (isRunning || isAutoTimerPaused || isInTransition) {
      // Pause (preserve all state)
      cancelHalfwayPauseAndStop();
    } else {
      // Start or Resume
      setIsRunning(true);
      // Only play start sound if starting from beginning
      if (isManualMode && timeRemaining === initialTotalTime) {
        playTimerSound(HALF_MARK_SOUND_REQUIRE["bell"]);
      } else if (!isManualMode && selectedFlow) {
        const firstItem = selectedFlow.items[0];
        const firstPoseDuration = isSuperset(firstItem)
          ? getScaledDuration(firstItem.poses[0].duration)
          : getScaledDuration(firstItem.duration);
        if (currentItemIndex === 0 && currentPoseInSuperset === 0 && timeRemaining === firstPoseDuration) {
          playTimerSound(HALF_MARK_SOUND_REQUIRE["bell"]);
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
    cancelHalfwayPauseAndStop();
    if (isManualMode) {
      setTimeRemaining(initialTotalTime);
    } else if (selectedFlow) {
      initializeFirstPose(selectedFlow);
    }
  };

  const handleSelectDifferentFlow = () => {
    setShowPauseOverlay(false);
    cancelHalfwayPauseAndStop();
    if (YOGA_FLOW_ENABLED) {
      setShowFlowSelect(true);
    }
  };

  // ─── Pace handlers ──────────────────────────────────────────────────────────

  // Apply pace values to current timer-settings state. Caller decides
  // whether to also mark this as the active pace.
  const applyPaceValuesToState = (
    p: TimerPace | TimerPaceInput,
  ) => {
    setInitialTotalTime(p.initialTotalTime);
    setTimeRemaining(p.initialTotalTime);
    setTransitionPauseMs(p.transitionPauseMs);
    setTransitionSound(p.transitionSound);
    setHalfMarkPauseMs(p.halfMarkPauseMs);
    setHalfMarkSound(p.halfMarkSound);
    setHalfMarkEnabled(p.halfMarkEnabled);
  };

  // Snapshot of the current hamburger state — used to pre-fill the pace
  // form regardless of whether it's opened from the list or the hamburger.
  const currentSettingsAsPaceInput = (): TimerPaceInput => ({
    name: "",
    initialTotalTime,
    transitionPauseMs,
    transitionSound,
    halfMarkPauseMs,
    halfMarkSound,
    halfMarkEnabled,
  });

  // Tap a pace in the list → load its values and remember it as active.
  const handleApplyPace = (pace: TimerPace) => {
    cancelHalfwayPauseAndStop();
    applyPaceValuesToState(pace);
    setActivePaceId(pace.id);
    saveActivePaceId(pace.id);
    setShowPaceList(false);
  };

  // "+ Create new Pace" in the list — opens form pre-filled with current
  // hamburger state (matches "Save as Pace" from hamburger for consistency).
  const handleOpenCreateFromList = () => {
    setPaceFormMode("create");
    setPaceFormInitial(currentSettingsAsPaceInput());
    setEditingPaceId(null);
    setShowPaceList(false);
    setPaceFormVisible(true);
  };

  // Hamburger "Save as Pace" button — opens form pre-filled with current values.
  const handleOpenCreateFromHamburger = () => {
    setPaceFormMode("create");
    setPaceFormInitial(currentSettingsAsPaceInput());
    setEditingPaceId(null);
    setPaceFormVisible(true);
  };

  // Swipe Edit on a pace row.
  const handleOpenEditPace = (pace: TimerPace) => {
    setPaceFormMode("edit");
    setPaceFormInitial({
      name: pace.name,
      initialTotalTime: pace.initialTotalTime,
      transitionPauseMs: pace.transitionPauseMs,
      transitionSound: pace.transitionSound,
      halfMarkPauseMs: pace.halfMarkPauseMs,
      halfMarkSound: pace.halfMarkSound,
      halfMarkEnabled: pace.halfMarkEnabled,
    });
    setEditingPaceId(pace.id);
    setShowPaceList(false);
    setPaceFormVisible(true);
  };

  // Swipe Delete on a pace row (after confirmation prompt in the list modal).
  const handleDeletePace = async (pace: TimerPace) => {
    await deletePace(pace.id);
    setPaces((prev) => prev.filter((p) => p.id !== pace.id));
    if (activePaceId === pace.id) {
      setActivePaceId(null);
      saveActivePaceId(null);
      // Leave hamburger settings as-is — user can pick another pace or keep tweaking
    }
  };

  // Form Save — routes to addPace or updatePace based on mode.
  const handlePaceFormSave = async (values: TimerPaceInput) => {
    if (paceFormMode === "create") {
      const newPace = await addPace(values);
      setPaces((prev) => [newPace, ...prev]);
      // A freshly created pace becomes the active one — the user just
      // chose & named these settings, presumably they want to use them now.
      applyPaceValuesToState(newPace);
      setActivePaceId(newPace.id);
      saveActivePaceId(newPace.id);
    } else if (paceFormMode === "edit" && editingPaceId) {
      const updated = await updatePace(editingPaceId, values);
      if (updated) {
        setPaces((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        // If we just edited the active pace, re-apply its (possibly changed) values.
        if (editingPaceId === activePaceId) {
          applyPaceValuesToState(updated);
        }
      }
    }
    setPaceFormVisible(false);
    setEditingPaceId(null);
  };

  const handlePaceFormCancel = () => {
    setPaceFormVisible(false);
    setEditingPaceId(null);
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
      {/* Hamburger button — manual mode only, absolute top-left */}
      {isManualMode && (
        <View style={styles.hamburgerContainer}>
          <HamburgerSvg
            onPress={() => {
              if (!showTimerSettings) cancelHalfwayPauseAndStop();
              setShowTimerSettings((prev) => !prev);
            }}
            color={yogaColors.instructionalText}
          />
        </View>
      )}

      {/* Content area - flex to prevent pushing button off screen */}
      <View style={styles.contentArea}>
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

      {/* Flow / Pace label — in manual mode shows the active pace name
          (or "Pace" placeholder if none loaded). When yoga-flow is enabled
          and a flow is selected, shows the flow name as before. */}
      <View style={styles.flowNameContainer}>
        <Text style={styles.flowName}>
          {isManualMode
            ? (activePaceId
                ? paces.find((p) => p.id === activePaceId)?.name ?? "Pace"
                : "Pace")
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

      </View>

      {/* Current time - anchored above button */}
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
              {(isRunning || isAutoTimerPaused || isInTransition) ? "Stop" : (timeRemaining > 0 && (isManualMode ? timeRemaining < initialTotalTime : true)) ? "Resume" : "Start"}
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

            {YOGA_FLOW_ENABLED && (
              <TouchableOpacity
                style={styles.pauseButton}
                activeOpacity={0.7}
                onPress={handleSelectDifferentFlow}
              >
                <Text style={styles.pauseButtonText}>Select Different Flow</Text>
              </TouchableOpacity>
            )}
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
          cancelHalfwayPauseAndStop();

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
        LinearGradient={LinearGradient}
        styles={{
          theme: "dark",
        }}
        modalProps={{
          overlayOpacity: 0.2,
        }}
      />

      {/* Timer Settings Panel — slides down from top, manual mode only */}
      {isManualMode && (
        <TimerSettingsPanel
          visible={showTimerSettings}
          onClose={() => setShowTimerSettings(false)}
          transitionPauseMs={transitionPauseMs}
          onTransitionPauseMsChange={setTransitionPauseMs}
          transitionSound={transitionSound}
          onTransitionSoundChange={setTransitionSound}
          halfMarkPauseMs={halfMarkPauseMs}
          onHalfMarkPauseMsChange={setHalfMarkPauseMs}
          halfMarkSound={halfMarkSound}
          onHalfMarkSoundChange={setHalfMarkSound}
          halfMarkEnabled={halfMarkEnabled}
          onHalfMarkEnabledChange={setHalfMarkEnabled}
          onSavePace={handleOpenCreateFromHamburger}
        />
      )}

      {/* Pace list modal — opens when user taps the center icon (manual mode, not running) */}
      <PaceListModal
        visible={showPaceList}
        paces={paces}
        onClose={() => setShowPaceList(false)}
        onApply={handleApplyPace}
        onCreate={handleOpenCreateFromList}
        onEdit={handleOpenEditPace}
        onDelete={handleDeletePace}
      />

      {/* Pace form modal — Create or Edit, used by list + hamburger entry points */}
      {paceFormInitial && (
        <PaceFormModal
          visible={paceFormVisible}
          mode={paceFormMode}
          initialValues={paceFormInitial}
          onSave={handlePaceFormSave}
          onCancel={handlePaceFormCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  contentArea: {
    flex: 1,
    alignItems: "center" as const,
    width: "100%",
  },
  // Hamburger button — absolute top-left, above all content
  hamburgerContainer: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 10,
  },
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
    marginTop: 4,
    paddingHorizontal: 20,
  },
  flowName: {
    ...yogaTypography.flowName,
  },

  // Superset Info
  supersetInfoContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
    alignItems: "center" as const,
    minHeight: 40, // Reserve space to prevent layout shift
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
    height: 40, // Match minHeight to maintain consistent spacing
  },

  // Progress Text
  progressTextContainer: {
    marginBottom: 2,
    paddingHorizontal: 30,
    minHeight: 10,
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
    marginTop: 12,
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
