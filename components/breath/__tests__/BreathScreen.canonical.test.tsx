/**
 * Canonical smoke test for BreathScreen — entry #1 of
 * docs/canonical-features.md: non-repeating timers chime at start and end.
 *
 * This is deliberately a WIRING test, not a layout test: the pure layers
 * already prove `finished` fires at the right moment — what got lost in the
 * 2026-06 rebuild (and what this test guards) is the one line connecting
 * those events to sounds. Assert behavior only; never snapshot layout.
 */
import React from "react";
import { Text } from "react-native";
import renderer, { act, ReactTestRenderer } from "react-test-renderer";

jest.mock("@/assets/utils/sounds", () => ({
  playSnap: jest.fn(),
  playBeat: jest.fn(),
  playStart: jest.fn(),
  playEndChime: jest.fn(),
  playHittStart: jest.fn(),
}));

// Short saved session (5s) so the test fast-forwards quickly.
jest.mock("@/assets/utils/persistent-storage", () => ({
  getData: jest.fn(async () => ({ breathTotalSec: 5 })),
  storeData: jest.fn(),
}));

jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(async () => ({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setVolumeAsync: jest.fn(),
          setPositionAsync: jest.fn(),
          setIsLoopingAsync: jest.fn(),
        },
        status: { isLoaded: true, durationMillis: 6500 },
      })),
    },
  },
}));

jest.mock("expo-linear-gradient", () => ({ LinearGradient: () => null }));
jest.mock("react-native-timer-picker", () => ({ TimerPickerModal: () => null }));

import BreathScreen from "../BreathScreen";
import { playStart, playEndChime } from "@/assets/utils/sounds";

const pressTextButton = (tree: ReactTestRenderer, label: string) => {
  // findAll + predicate instead of findAllByType: @types/react-test-renderer
  // pins its own @types/react, which clashes with RN's Text component type.
  const text = tree.root.find(
    (n) => n.type === (Text as unknown) && n.props.children === label,
  ); // find() throws if the label isn't on screen
  let node: typeof text.parent = text;
  while (node && typeof node.props?.onPress !== "function") node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for "${label}"`);
  act(() => node!.props.onPress());
};

describe("canonical #1: pranayama chimes at start and end", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("plays the start bell on Start and the end bell when the session completes", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    pressTextButton(tree, "Start");
    expect(playStart).toHaveBeenCalledTimes(1);
    expect(playEndChime).not.toHaveBeenCalled();

    // Fast-forward past the 5s session (the hook ticks every 100ms).
    await act(async () => {
      jest.advanceTimersByTime(6_000);
    });
    expect(playEndChime).toHaveBeenCalledTimes(1);

    act(() => tree.unmount());
  }, 20_000);

  it("does NOT play the end bell when the user stops early", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    pressTextButton(tree, "Start");
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    pressTextButton(tree, "Stop");
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(playEndChime).not.toHaveBeenCalled();

    act(() => tree.unmount());
  }, 20_000);
});
