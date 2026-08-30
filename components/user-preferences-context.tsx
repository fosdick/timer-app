/**
 * UserPreferencesContext — the "User Preferences" page settings, persisted.
 *
 * Mirrors DisplayAdsContext/ActiveTimerContext: a provider mounted high in
 * app/_layout.tsx, read anywhere via useUserPreferences().
 *
 * - useRounds: pick a breath pattern's session length by number of rounds
 *   (ends on an exhale). When off, patterns use the plain time wheel like the
 *   metronome. (Migrated from the former autoCorrectExhaleEnd toggle.)
 * - downbeatByPattern: per breath-pattern, whether the downbeat snap plays on
 *   each count during inhale/exhale. Single source of truth for both the
 *   per-pattern on-screen toggle and the Viloma/Visamavritti rows on the prefs
 *   page. Absent entry => default (Viloma on, every other pattern off).
 * - countInEnabled / countInSec: the pranayama "Begin in" pre-roll — whether it
 *   runs on a fresh start, and how many seconds it counts down from.
 * - pronoun: she / they / he, shown as the header glyph. Default "they" — someone
 *   who never opens this page gets the neutral icon rather than a guess. Its colour
 *   is deliberately NOT themed (see assets/images/svgx/user.tsx).
 * - accentId: which colour accent the app uses. Accent-only theming — the ramp in
 *   assets/theme/accent.ts changes, the dark ground and neutrals never do. Green is
 *   the brand (the logo is green) and is the default.
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
import { ACCENTS, DEFAULT_ACCENT_ID, type Accent, type AccentId,
  ACCENT_ALIASES,
} from "@/assets/theme/accent";
import { PRONOUNS, type Pronoun } from "@/assets/images/svgx/user";
import {
  makeColorTheme,
  makeTimerStyles,
  makePranayamaStyles,
  makeHiitStyles,
  makeScreenStyles,
  makeTimerPickerModalStyles,
} from "@/assets/styles/timer-app";
import { makeYogaColors } from "@/assets/theme/colors";
import { makeYogaTypography } from "@/assets/theme/typography";

export type UserPreferences = {
  useRounds: boolean;
  downbeatByPattern: Record<string, boolean>;
  countInEnabled: boolean;
  countInSec: number;
  accentId: AccentId;
  pronoun: Pronoun;
};

/** Bounds for the "Begin in" pre-roll duration (whole seconds). */
export const COUNT_IN_MIN = 1;
export const COUNT_IN_MAX = 60;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  useRounds: true,
  downbeatByPattern: {},
  countInEnabled: true,
  countInSec: 8,
  accentId: DEFAULT_ACCENT_ID,
  pronoun: "they",
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
  setUseRounds: (value: boolean) => void;
  setDownbeatEnabled: (patternId: string, value: boolean) => void;
  setCountInEnabled: (value: boolean) => void;
  setCountInSec: (value: number) => void;
  setAccentId: (value: AccentId) => void;
  setPronoun: (value: Pronoun) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  prefs: DEFAULT_USER_PREFERENCES,
  setUseRounds: () => {},
  setDownbeatEnabled: () => {},
  setCountInEnabled: () => {},
  setCountInSec: () => {},
  setAccentId: () => {},
  setPronoun: () => {},
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
          // Migrate the former autoCorrectExhaleEnd toggle to useRounds (same intent).
          useRounds: saved.useRounds ?? saved.autoCorrectExhaleEnd ?? prev.useRounds,
          downbeatByPattern: { ...prev.downbeatByPattern, ...saved.downbeatByPattern },
          // Ignore an unknown accent id — a theme could be renamed or removed in a
          // later version, and a stale preference must not leave the app unstyled.
          // ACCENT_ALIASES carries renamed ids ("blue" -> "ice"), so a rename
          // does not silently reset someone to the default accent.
          accentId:
            saved.accentId in ACCENTS
              ? saved.accentId
              : ACCENT_ALIASES[saved.accentId as string] ?? prev.accentId,
          // Same guard: an unrecognised value must fall back rather than render
          // an icon with no silhouette and no colour.
          pronoun: PRONOUNS.includes(saved.pronoun) ? saved.pronoun : prev.pronoun,
        }));
      }
    });
  }, []);

  const persist = useCallback((next: UserPreferences) => {
    storeData(USER_PREFERENCES_KEY, next);
  }, []);

  const setUseRounds = useCallback(
    (value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, useRounds: value };
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

  const setAccentId = useCallback(
    (value: AccentId) => {
      setPrefs((prev) => {
        const next = { ...prev, accentId: value };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setPronoun = useCallback(
    (value: Pronoun) => {
      setPrefs((prev) => {
        const next = { ...prev, pronoun: value };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      prefs,
      setUseRounds,
      setDownbeatEnabled,
      setCountInEnabled,
      setCountInSec,
      setAccentId,
      setPronoun,
    }),
    [
      prefs,
      setUseRounds,
      setDownbeatEnabled,
      setCountInEnabled,
      setCountInSec,
      setAccentId,
      setPronoun,
    ],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

const useUserPreferences = () => useContext(UserPreferencesContext);

/**
 * The active accent ramp. This is what styled components read.
 *
 * Deliberately a thin wrapper over the preference rather than its own provider:
 * one source of truth, one place that persists, nothing extra to mount.
 */
/**
 * Reactive token sets. Components call these instead of importing the static
 * exports; the static ones remain valid green instances so the migration is
 * incremental. Each memoises on the accent so styles rebuild only on a theme
 * change, not per render.
 */
const useAppColors = () => {
  const accent = useAccent();
  return useMemo(() => makeColorTheme(accent), [accent]);
};

/**
 * The SHARED stylesheets, themed. These are the backbone of the Yoga and HIIT tabs —
 * those screens are built almost entirely from TimerStyles / HiitStyles /
 * screenStyles rather than from per-component styles, which is why converting
 * individual components left them looking completely unthemed.
 */
const useAppStyles = () => {
  const c = useAppColors();
  return useMemo(
    () => ({
      colors: c,
      timer: makeTimerStyles(c),
      pranayama: makePranayamaStyles(c),
      hiit: makeHiitStyles(c),
      screen: makeScreenStyles(c),
      picker: makeTimerPickerModalStyles(c),
    }),
    [c],
  );
};

const useYogaTheme = () => {
  const accent = useAccent();
  return useMemo(() => {
    const colors = makeYogaColors(accent);
    return { colors, typography: makeYogaTypography(accent, colors) };
  }, [accent]);
};

const useAccent = (): Accent => {
  const { prefs } = useContext(UserPreferencesContext);
  return ACCENTS[prefs.accentId] ?? ACCENTS[DEFAULT_ACCENT_ID];
};

export {
  useAccent,
  useAppColors,
  useAppStyles,
  useYogaTheme,
  UserPreferencesProvider,
  UserPreferencesContext,
  useUserPreferences,
};
