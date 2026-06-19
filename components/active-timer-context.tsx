/**
 * ActiveTimerContext
 *
 * A single shared answer to "is any timer currently running?" — read by the
 * tab bar so an accidental tap (phone set down mid-practice) can be gated
 * behind a confirm instead of silently stopping the session.
 *
 * Mirrors DisplayAdsContext: provider mounted high in app/_layout.tsx; any
 * descendant reads via useContext. The three tab screens are rendered by
 * expo-router (not by props), so context — not prop drilling — is the only
 * way to share this across the router boundary.
 *
 * State is keyed by screen ("breath" | "yoga" | "hitt") rather than a single
 * boolean: all three screens stay mounted at once, so a keyed record keeps an
 * idle screen from clobbering the running one's flag. isAnyTimerRunning is the
 * derived OR.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type TimerKey = "breath" | "yoga" | "hitt";

type ActiveTimerContextType = {
  isAnyTimerRunning: boolean;
  setTimerRunning: (key: TimerKey, running: boolean) => void;
};

// No-op default so a consumer outside the provider never crashes (mirrors
// DisplayAdsContext). The provider always supplies the real implementation.
const ActiveTimerContext = createContext<ActiveTimerContextType>({
  isAnyTimerRunning: false,
  setTimerRunning: () => {},
});

const ActiveTimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [runningByKey, setRunningByKey] = useState<
    Partial<Record<TimerKey, boolean>>
  >({});

  // Stable identity so the reporting effect below doesn't re-fire on render.
  // No-op when the value is unchanged, to avoid redundant renders.
  const setTimerRunning = useCallback((key: TimerKey, running: boolean) => {
    setRunningByKey((prev) => {
      if (!!prev[key] === running) return prev;
      return { ...prev, [key]: running };
    });
  }, []);

  const isAnyTimerRunning = useMemo(
    () => Object.values(runningByKey).some(Boolean),
    [runningByKey],
  );

  const value = useMemo<ActiveTimerContextType>(
    () => ({ isAnyTimerRunning, setTimerRunning }),
    [isAnyTimerRunning, setTimerRunning],
  );

  return (
    <ActiveTimerContext.Provider value={value}>
      {children}
    </ActiveTimerContext.Provider>
  );
};

/**
 * Each timer screen calls this with its own running flag. It mirrors the flag
 * into the shared context and clears it on unmount, so the tab bar always sees
 * the truth without the screens knowing anything about navigation.
 */
const useReportActiveTimer = (key: TimerKey, running: boolean) => {
  const { setTimerRunning } = useContext(ActiveTimerContext);

  useEffect(() => {
    setTimerRunning(key, running);
  }, [key, running, setTimerRunning]);

  useEffect(
    () => () => setTimerRunning(key, false),
    [key, setTimerRunning],
  );
};

export {
  ActiveTimerProvider,
  ActiveTimerContext,
  useReportActiveTimer,
};
