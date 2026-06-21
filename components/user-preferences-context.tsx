/**
 * UserPreferencesContext — the "User Preferences" page settings, persisted.
 *
 * Mirrors DisplayAdsContext/ActiveTimerContext: a provider mounted high in
 * app/_layout.tsx, read anywhere via useUserPreferences().
 *
 * - autoCorrectExhaleEnd: round pranayama length up to end on an exhale.
 * - downbeatByPattern: per breath-pattern, whether the downbeat snap plays on
 *   each count during inhale/exhale. Single source of truth for both the
 *   per-pattern on-screen toggle and the Viloma/Visamavritti rows on the prefs
 *   page. Absent entry => default (Viloma on, every other pattern off).
 * - countInEnabled / countInSec: the pranayama "Begin in" pre-roll — whether it
 *   runs on a fresh start, and how many seconds it counts down from.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getData, storeData } from "@/assets/utils/persistent-storage";

export type UserPreferences = {
  autoCorrectExhaleEnd: boolean;
  downbeatByPattern: Record<string, boolean>;
  countInEnabled: boolean;
  countInSec: number;
};

/** Bounds for the "Begin in" pre-roll duration (whole seconds). */
export const COUNT_IN_MIN = 1;
export const COUNT_IN_MAX = 60;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  autoCorrectExhaleEnd: true,
  downbeatByPattern: {},
  countInEnabled: true,
  countInSec: 8,
};

/** Patterns with downbeats on by default (only Viloma, per product). */
const DOWNBEAT_DEFAULT_ON = new Set(["viloma"]);

/** Whether downbeats are enabled for a pattern, applying the default when unset. */
export const isDownbeatEnabled = (
  prefs: UserPreferences,
  patternId: string,
): boolean => prefs.downbeatByPattern[patternId] ?? DOWNBEAT_DEFAULT_ON.has(patternId);

const USER_PREFERENCES_KEY = "user_preferences";

type UserPreferencesContextType = {
  prefs: UserPreferences;
  setAutoCorrectExhaleEnd: (value: boolean) => void;
  setDownbeatEnabled: (patternId: string, value: boolean) => void;
  setCountInEnabled: (value: boolean) => void;
  setCountInSec: (value: number) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  prefs: DEFAULT_USER_PREFERENCES,
  setAutoCorrectExhaleEnd: () => {},
  setDownbeatEnabled: () => {},
  setCountInEnabled: () => {},
  setCountInSec: () => {},
});

const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  // Load saved prefs on mount, merged over defaults.
  useEffect(() => {
    getData(USER_PREFERENCES_KEY).then((saved) => {
      if (saved) {
        setPrefs((prev) => ({
          ...prev,
          ...saved,
          downbeatByPattern: { ...prev.downbeatByPattern, ...saved.downbeatByPattern },
        }));
      }
    });
  }, []);

  const persist = useCallback((next: UserPreferences) => {
    storeData(USER_PREFERENCES_KEY, next);
  }, []);

  const setAutoCorrectExhaleEnd = useCallback(
    (value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, autoCorrectExhaleEnd: value };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setDownbeatEnabled = useCallback(
    (patternId: string, value: boolean) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          downbeatByPattern: { ...prev.downbeatByPattern, [patternId]: value },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setCountInEnabled = useCallback(
    (value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, countInEnabled: value };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setCountInSec = useCallback(
    (value: number) => {
      // Store a clamped whole second so callers never have to re-validate.
      const clamped = Math.min(
        COUNT_IN_MAX,
        Math.max(COUNT_IN_MIN, Math.round(value)),
      );
      setPrefs((prev) => {
        const next = { ...prev, countInSec: clamped };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      prefs,
      setAutoCorrectExhaleEnd,
      setDownbeatEnabled,
      setCountInEnabled,
      setCountInSec,
    }),
    [
      prefs,
      setAutoCorrectExhaleEnd,
      setDownbeatEnabled,
      setCountInEnabled,
      setCountInSec,
    ],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

const useUserPreferences = () => useContext(UserPreferencesContext);

export {
  UserPreferencesProvider,
  UserPreferencesContext,
  useUserPreferences,
};
