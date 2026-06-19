/**
 * Wiring test for ActiveTimerContext.
 *
 * The non-trivial part is the keyed record: all three tab screens stay mounted,
 * so an idle screen reporting `false` must NOT clobber the running screen's
 * `true`. That's exactly what this guards.
 */
import React, { useContext } from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import {
  ActiveTimerProvider,
  ActiveTimerContext,
  useReportActiveTimer,
  type TimerKey,
} from "../active-timer-context";

const Reporter = ({ k, running }: { k: TimerKey; running: boolean }) => {
  useReportActiveTimer(k, running);
  return null;
};

const Readout = () => {
  const { isAnyTimerRunning } = useContext(ActiveTimerContext);
  return <Text>{isAnyTimerRunning ? "RUNNING" : "IDLE"}</Text>;
};

const Tree = ({ breath, hitt }: { breath: boolean; hitt: boolean }) => (
  <ActiveTimerProvider>
    <Reporter k="breath" running={breath} />
    <Reporter k="hitt" running={hitt} />
    <Readout />
  </ActiveTimerProvider>
);

describe("ActiveTimerContext", () => {
  it("is idle when nothing reports running", () => {
    render(<Tree breath={false} hitt={false} />);
    expect(screen.getByText("IDLE")).toBeOnTheScreen();
  });

  it("is running when any one screen reports running", () => {
    const { rerender } = render(<Tree breath={false} hitt={false} />);
    rerender(<Tree breath={true} hitt={false} />);
    expect(screen.getByText("RUNNING")).toBeOnTheScreen();
  });

  it("an idle screen does not clobber a running screen's flag", () => {
    const { rerender } = render(<Tree breath={true} hitt={false} />);
    expect(screen.getByText("RUNNING")).toBeOnTheScreen();
    // hitt re-reports idle (as a mounted-but-stopped tab would) — still running.
    rerender(<Tree breath={true} hitt={false} />);
    expect(screen.getByText("RUNNING")).toBeOnTheScreen();
  });

  it("returns to idle only once all screens have stopped", () => {
    const { rerender } = render(<Tree breath={true} hitt={true} />);
    expect(screen.getByText("RUNNING")).toBeOnTheScreen();
    rerender(<Tree breath={false} hitt={true} />);
    expect(screen.getByText("RUNNING")).toBeOnTheScreen();
    rerender(<Tree breath={false} hitt={false} />);
    expect(screen.getByText("IDLE")).toBeOnTheScreen();
  });
});
