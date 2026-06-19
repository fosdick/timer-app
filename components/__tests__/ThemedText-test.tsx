/**
 * ThemedText render test (RNTL).
 *
 * Was a react-test-renderer snapshot — brittle, and it broke under React 19
 * (un-acted state update → null tree). RNTL's render wraps in act and we
 * assert behavior (the text shows) instead of snapshotting layout, in line
 * with the project's "assert behavior, never snapshot" testing stance.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react-native";

import { ThemedText } from "../ThemedText";

it("renders its text content", () => {
  render(<ThemedText>Snapshot test!</ThemedText>);
  expect(screen.getByText("Snapshot test!")).toBeOnTheScreen();
});
