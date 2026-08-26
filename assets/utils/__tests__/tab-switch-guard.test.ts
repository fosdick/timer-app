/**
 * Contract test for the canonical behavior:
 * "While a timer is running, switching tabs is gated by a confirmation."
 * (canonical-features.md — nominated 2026-06-19)
 *
 * Guards the decision in isolation; the layout supplies the real side effects.
 */
import { guardTabPress } from "../tab-switch-guard";

describe("guardTabPress", () => {
  it("lets the switch happen normally when no timer is running", () => {
    const preventDefault = jest.fn();
    const confirmSwitch = jest.fn();

    guardTabPress({ isAnyTimerRunning: false, preventDefault, confirmSwitch });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(confirmSwitch).not.toHaveBeenCalled();
  });

  it("blocks the silent switch and asks first when a timer is running", () => {
    const preventDefault = jest.fn();
    const confirmSwitch = jest.fn();

    guardTabPress({ isAnyTimerRunning: true, preventDefault, confirmSwitch });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(confirmSwitch).toHaveBeenCalledTimes(1);
  });
});
