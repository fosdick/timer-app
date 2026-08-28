/**
 * The end bell must not overlap a boundary click.
 *
 * Reported from real practice (2026-08-28): "there are times when the sounds will
 * overlap... the end chime goes off and then transition sound might overlap."
 *
 * Cause: in one `tick()` the hook fired every boundary click found in the elapsed
 * window and THEN, in the same synchronous pass, fired `onFinish` if the session
 * had ended. `start()` has always guarded the mirror case — it nudges past a
 * boundary sitting on the start instant, "the start bell already marks it" — but
 * nothing guarded the finish.
 *
 * The collision is near-structural, not rare: `adjustTotalToExhaleEnd` puts the
 * session end ON an exhale boundary, and a boundary is exactly where a click fires.
 * Whether it landed inside the finishing 100ms tick came down to Date.now() jitter,
 * which is why it was intermittent and hard to reproduce deliberately.
 *
 * NOTE ON PLACEMENT: tests under assets/ are otherwise pure-logic (see CLAUDE.md).
 * This one needs a renderer because the defect is in the hook's tick ordering, not
 * in the pure helpers — `clicksBetween` and `downbeatsBetween` were both correct.
 * It sits beside the hook it guards rather than under components/.
 */
import React, { useEffect } from "react";
import renderer, { act } from "react-test-renderer";

import { useBreathTimer } from "../use-breath-timer";
import { type BreathClick } from "@/assets/data/breath-timer-core";
import { BOX } from "@/assets/data/breath-patterns";

// Box is 4/4/4/4 -> a 16s cycle at countDurationSec 1, boundaries at 0, 4, 8, 12, 16.
//
// TWO totals, because the two collision modes need different setups and the FIRST
// draft of this test used only the exact-boundary one and passed against the broken
// code:
//
//  ON_BOUNDARY (16) — what adjustTotalToExhaleEnd produces. Under fake timers ticks
//    land on exact 100ms multiples, so elapsed hits 16.000 and the boundary at 16 is
//    excluded by the half-open window [15.9, 16.0). The collision does NOT reproduce
//    here; only real Date.now() jitter pulls it in. Kept as a regression guard, not
//    as the proof.
//
//  MID_WINDOW (16.05) — the metronome case, and the one that REPRODUCES. Tick 16.1
//    sees window [16.0, 16.1), which contains the boundary at 16, and the view at
//    16.1 is already finished. So click and end bell fire in the same pass.
const ON_BOUNDARY = 16;
const MID_WINDOW = 16.05;

const Harness = ({
  total,
  onClick,
  onFinish,
  onDownbeat,
}: {
  total: number;
  onClick: (c: BreathClick) => void;
  onFinish: () => void;
  onDownbeat?: () => void;
}) => {
  const timer = useBreathTimer(BOX, total, { onClick, onFinish, onDownbeat });
  useEffect(() => {
    timer.start();
    // start() is stable (useCallback) and this must run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const runSession = (total: number, opts: { withDownbeats?: boolean } = {}) => {
  const clicks: number[] = [];
  const downbeats: number[] = [];
  // Record how many cues had sounded at the moment the bell rang. Anything that
  // fires in the finishing pass lands BEFORE onFinish, so a count here that exceeds
  // the count of cues legitimately before the end is the overlap.
  const cuesWhenBellRang: number[] = [];
  act(() => {
    renderer.create(
      <Harness
        total={total}
        onClick={(c) => clicks.push(c.time)}
        onFinish={() => cuesWhenBellRang.push(clicks.length + downbeats.length)}
        onDownbeat={opts.withDownbeats ? () => downbeats.push(1) : undefined}
      />,
    );
  });
  act(() => {
    jest.advanceTimersByTime(Math.ceil(total + 2) * 1000);
  });
  return { clicks, downbeats, cuesWhenBellRang };
};

beforeEach(() => {
  // Modern fake timers also drive Date.now(), which this hook reads directly.
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("boundary clicks vs the end bell", () => {
  it("does not sound a click in the finishing tick (metronome-style total)", () => {
    // THE proof. Boundary 16 sits inside the finishing window for a 16.05s total, so
    // the unguarded tick fired it and then rang the bell in the same pass.
    const { clicks, cuesWhenBellRang } = runSession(MID_WINDOW);

    expect(cuesWhenBellRang).toHaveLength(1);   // the session ended exactly once
    // Boundaries strictly inside the session are 4, 8 and 12 (0 is skipped by
    // start()'s guard). The one at 16 must NOT have sounded.
    expect(clicks).toEqual([4, 8, 12]);
  });

  it("does not sound a click when the total lands exactly on a boundary", () => {
    // adjustTotalToExhaleEnd's shape. Does not reproduce under fake timers (see the
    // note above) but guards the case against future changes to tick alignment.
    const { clicks, cuesWhenBellRang } = runSession(ON_BOUNDARY);
    expect(cuesWhenBellRang).toHaveLength(1);
    expect(clicks).toEqual([4, 8, 12]);
  });

  it("still sounds every boundary strictly inside the session", () => {
    // Guards the over-correction: suppressing the finishing window must not silence
    // legitimate mid-session clicks.
    const { clicks } = runSession(MID_WINDOW);
    expect(clicks).toContain(4);
    expect(clicks).toContain(8);
    expect(clicks).toContain(12);
  });

  it("applies the same guard to per-count downbeat snaps", () => {
    const { downbeats, cuesWhenBellRang } = runSession(MID_WINDOW, { withDownbeats: true });
    expect(cuesWhenBellRang).toHaveLength(1);
    expect(downbeats.length).toBeGreaterThan(0);   // snaps did fire during the session
  });
});
