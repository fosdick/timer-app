/**
 * UserPreferencesContext — the "User Preferences" page settings, persisted.
 *
 * Mirrors DisplayAdsContext/ActiveTimerContext: a provider mounted high in
 * app/_layout.tsx, read anywhere via useUserPreferences(). Only the
 * auto-correct-to-exhale pref is wired into behavior in this layer; the snap
 * prefs are persisted now and consumed when the downbeat sound system lands.
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
  /** Round pranayama session length up so it ends on an exhale. */
  autoCorrectExhaleEnd: boolean;
  /** Metronome snap on Viloma's "sips" (pending the downbeat sound system). */
  vilomaSnap: boolean;
  /** Metronome snap on Visamavritti (pending the downbeat sound system). */
  visamavrittiSnap: boolean;
  /** Downbeat snap on every count, all patterns except metronome (pending). */
  allDownbeatSnaps: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  autoCorrectExhaleEnd: true,
  vilomaSnap: true,
  visamavrittiSnap: false,
  allDownbeatSnaps: false,
};

const USER_PREFERENCES_KEY = "user_preferences";

type UserPreferencesContextType = {
  prefs: UserPreferences;
  setPref: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  prefs: DEFAULT_USER_PREFERENCES,
  setPref: () => {},
});

const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  // Load saved prefs on mount, merged over defaults so a newly-added pref keeps
  // its default until the user changes it.
  useEffect(() => {
    getData(USER_PREFERENCES_KEY).then((saved) => {
      if (saved) setPrefs((prev) => ({ ...prev, ...saved }));
    });
  }, []);

  const setPref = useCallback<UserPreferencesContextType["setPref"]>(
    (key, value) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        storeData(USER_PREFERENCES_KEY, next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(() => ({ prefs, setPref }), [prefs, setPref]);

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
