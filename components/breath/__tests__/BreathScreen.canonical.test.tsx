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
  playAsset: jest.fn(),
  playSnap: jest.fn(),
  playBeat: jest.fn(),
  playStart: jest.fn(),
  playEndChime: jest.fn(),
  playHittStart: jest.fn(),
}));

// BreathScreen is rendered bare (no navigator), so stub the expo-router hooks it
// uses. The focus-blur stop is navigation behavior, out of scope for these tests.
jest.mock("expo-router", () => ({
  useFocusEffect: () => {},
  useRouter: () => ({ push: jest.fn() }),
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

  it("plays the start bell after the count-in and the end bell when the session completes", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    // Start now begins an 8s count-in; the start bell fires when it reaches 0.
    pressTextButton(tree, "Start");
    expect(playStart).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(8_000); // count-in completes
    });
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
      jest.advanceTimersByTime(8_000); // finish count-in → session running
    });
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

describe("count-in (Begin in) — fresh start only", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const hasText = (tree: ReactTestRenderer, label: string) =>
    tree.root.findAll(
      (n) => n.type === (Text as unknown) && n.props.children === label,
    ).length > 0;

  it("shows a 'Begin in' count-in on a fresh Start and chimes only at 0", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    pressTextButton(tree, "Start");
    expect(hasText(tree, "Begin in")).toBe(true);
    expect(playStart).not.toHaveBeenCalled();

    // Partway through the count-in: still counting, no chime yet.
    await act(async () => {
      jest.advanceTimersByTime(3_000);
    });
    expect(playStart).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5_000); // reaches 0 (3 + 5 = 8s)
    });
    expect(playStart).toHaveBeenCalledTimes(1);
    expect(hasText(tree, "Begin in")).toBe(false);

    act(() => tree.unmount());
  }, 20_000);

  it("does NOT count in when resuming a paused sequence", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    pressTextButton(tree, "Start");
    await act(async () => {
      jest.advanceTimersByTime(8_000); // count-in done → running (start bell #1)
    });
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    pressTextButton(tree, "Stop"); // pause mid-sequence
    expect(playStart).toHaveBeenCalledTimes(1);

    pressTextButton(tree, "Start"); // resume — immediate, no count-in
    expect(hasText(tree, "Begin in")).toBe(false);
    expect(playStart).toHaveBeenCalledTimes(2);

    act(() => tree.unmount());
  }, 20_000);

  it("cancels the count-in if Stop is pressed before it reaches 0", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BreathScreen />);
    });

    pressTextButton(tree, "Start");
    await act(async () => {
      jest.advanceTimersByTime(3_000);
    });
    pressTextButton(tree, "Stop"); // cancel the count-in
    expect(hasText(tree, "Begin in")).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(20_000); // no start should ever fire
    });
    expect(playStart).not.toHaveBeenCalled();

    act(() => tree.unmount());
  }, 20_000);
});
