/**
 * Wiring test: the Pranayama session length is remembered PER BREATH PATTERN.
 *
 * The behaviour a user notices (reported 2026-08-28): set 10 rounds on Nadi
 * Shodhana, switch to Box and set 5, come back to Nadi — and the length you set is
 * gone. `breathTotalSec` was a single global scalar while counts and all three
 * sound choices were already per-pattern maps.
 *
 * Not a regression: a pattern-keyed length has never existed in this repo (checked
 * the full preserved history — `breathTotalSec` arrived as a scalar in 1f37994 and
 * multiple patterns only arrived with the 2026-06 rebuild). So this guards a NEW
 * behaviour rather than restoring a lost one.
 *
 * Why a wiring test and not a pure one: the storage shape and the per-pattern
 * round math are already pure and tested. What can break — and what broke here —
 * is the single connection between "which pattern is selected" and "which stored
 * length is shown". That lives in component state and is invisible to pure tests.
 *
 * Assertions compare the RENDERED clock rather than hard-coding seconds, because
 * `adjustTotalToExhaleEnd` legitimately adjusts the displayed total per pattern
 * (canonical entry: a session always ends on an exhale). Hard-coding would couple
 * this test to that math and make it fail for the wrong reason.
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

jest.mock("expo-router", () => ({
  useFocusEffect: () => {},
  useRouter: () => ({ push: jest.fn() }),
}));

// Per-test control over what is already in storage. Names must be `mock`-prefixed:
// jest forbids a mock factory from closing over any other out-of-scope variable.
const mockSaved: { data: Record<string, unknown> } = { data: {} };
const mockStoreData = jest.fn();
jest.mock("@/assets/utils/persistent-storage", () => ({
  getData: jest.fn(async () => mockSaved.data),
  storeData: (...args: unknown[]) => mockStoreData(...args),
}));

// Stub the length picker so its commit callback is reachable without driving a
// wheel. Both pickers commit through `onConfirm`, and SessionLengthModal's takes
// seconds directly (onConfirm={applyTotal}).
const mockPicker: { props: { onConfirm?: (s: number) => void } } = { props: {} };
jest.mock("../SessionLengthModal", () => ({
  SessionLengthModal: (props: { onConfirm?: (s: number) => void }) => {
    mockPicker.props = props;
    return null;
  },
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

/** Press a pattern button by its visible label (see the canonical test for why
 *  findAll + predicate rather than findAllByType). */
const pressTextButton = (tree: ReactTestRenderer, label: string) => {
  const text = tree.root.find(
    (n) => n.type === (Text as unknown) && n.props.children === label,
  );
  let node: typeof text.parent = text;
  while (node && typeof node.props?.onPress !== "function") node = node.parent;
  if (!node) throw new Error(`No pressable ancestor for "${label}"`);
  act(() => node!.props.onPress());
};

/** The countdown as SECONDS. Asserting magnitude rather than an exact string is
 *  what makes these tests real: adjustTotalToExhaleEnd nudges the total by a few
 *  seconds per pattern, so a "these two differ" assertion passes even when the
 *  length is global — it proves the adjustment math, not per-pattern storage.
 *  Minutes apart is a gap the adjustment cannot manufacture. */
const clockSeconds = (tree: ReactTestRenderer): number => {
  const [h, m, sec] = readClock(tree).split(":").map(Number);
  return h * 3600 + m * 60 + sec;
};

/** The countdown, e.g. "00:05:34". */
const readClock = (tree: ReactTestRenderer): string => {
  const node = tree.root.find(
    (n) =>
      n.type === (Text as unknown) &&
      typeof n.props.children === "string" &&
      /^\d{2}:\d{2}:\d{2}$/.test(n.props.children),
  );
  return node.props.children as string;
};

const mount = async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<BreathScreen />);
  });
  return tree;
};

beforeEach(() => {
  mockSaved.data = {};
  mockPicker.props = {};
  mockStoreData.mockClear();
});

describe("session length is remembered per breath pattern", () => {
  it("keeps each pattern's own length when switching away and back", async () => {
    // Two clearly different stored lengths. 600s vs 120s stay distinguishable
    // even after per-pattern exhale adjustment.
    mockSaved.data = { breathTotalByPattern: { nadi: 600, box: 120 } };
    const tree = await mount();

    const nadi = readClock(tree);              // starts on Nadi Shodhana (default)
    expect(clockSeconds(tree)).toBeGreaterThan(540);   // ~600s, not the 300s default

    pressTextButton(tree, "Box");
    expect(clockSeconds(tree)).toBeLessThan(180);      // ~120s — Box's OWN length

    pressTextButton(tree, "Nadi Shodhana");
    expect(readClock(tree)).toBe(nadi);        // ...and Nadi's is intact to the second
  });

  it("persists a new length under the current pattern only", async () => {
    mockSaved.data = { breathTotalByPattern: { nadi: 600, box: 120 } };
    const tree = await mount();

    pressTextButton(tree, "Box");
    // Open the picker so it mounts and captures its props, then commit 300s.
    pressTextButton(tree, readClock(tree));
    mockStoreData.mockClear();
    await act(async () => {
      mockPicker.props.onConfirm?.(300);
    });

    const written = mockStoreData.mock.calls.at(-1)?.[1] as
      | { breathTotalByPattern?: Record<string, number> }
      | undefined;
    expect(written?.breathTotalByPattern?.box).toBe(300);   // the selected pattern
    expect(written?.breathTotalByPattern?.nadi).toBe(600);  // left alone
  });
});

describe("upgrade path", () => {
  it("falls back to the old global length for every pattern, resetting nobody", async () => {
    // What an existing install looks like: the legacy scalar, no map. Every pattern
    // must start there rather than snapping to DEFAULT_TOTAL_SEC.
    mockSaved.data = { breathTotalSec: 900 };
    const tree = await mount();

    // Both patterns must derive from the same legacy 900s, not snap to the 300s
    // default. Assert magnitude: exhale adjustment moves seconds, not minutes.
    expect(clockSeconds(tree)).toBeGreaterThan(840);   // Nadi, from legacy 900s
    pressTextButton(tree, "Box");
    expect(clockSeconds(tree)).toBeGreaterThan(840);   // Box, same legacy value
  });
});
