/**
 * Pure decision for the tab bar's tabPress handler: when a timer is running,
 * an accidental tab tap must not silently stop the practice — block the
 * default switch and ask first.
 *
 * Kept pure (no React, no navigation) so the canonical behavior is covered by
 * a contract test; the layout just supplies the side effects.
 */
export type TabSwitchGuardDeps = {
  isAnyTimerRunning: boolean;
  /** Stop the navigator's default tab switch. */
  preventDefault: () => void;
  /** Show the "switch anyway?" confirmation (which performs the switch on yes). */
  confirmSwitch: () => void;
};

export function guardTabPress({
  isAnyTimerRunning,
  preventDefault,
  confirmSwitch,
}: TabSwitchGuardDeps): void {
  // Nothing running → tabs behave 100% normally: instant single-tap switch.
  if (!isAnyTimerRunning) return;

  // Running → block the silent switch and route through a confirmation.
  preventDefault();
  confirmSwitch();
}
