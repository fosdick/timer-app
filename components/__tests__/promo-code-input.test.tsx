/**
 * Wiring test for PromoCodeInput — guards canonical behavior:
 * after pressing Apply, the text field clears, on EVERY outcome.
 *
 * This is the regression net for the bug that escaped TWICE: first the clear
 * was missing entirely, then (2026-06-19) the success path cleared in React
 * state but lingered on-device — disabling the field (editable={!busy}) in the
 * same render that cleared it stranded the native iOS text clear.
 *
 * LIMITATION: RNTL renders a mock, not a real UITextField, so it CANNOT see
 * that native-reconciliation bug directly — input.props.value was "" the whole
 * time. What it CAN guard is the fix's mechanism: the field must stay editable
 * during an in-flight apply (so a real value→"" transition reaches native once
 * activation finishes). The truly native case needs device/E2E coverage.
 *
 * Mocking philosophy: keep findPromoByCode / PROMO_DEFS REAL so a real
 * code ("flowfree") genuinely matches; mock only the AsyncStorage-backed
 * side effects (activate/deactivate/load) and the native purchases module.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { activatePromo } from "@/assets/data/promo-codes";

// AsyncStorage + react-native-purchases are stubbed globally in jest.setup.js.

jest.mock("../../assets/utils/persistent-storage", () => ({
  getData: jest.fn(async () => null),
  storeData: jest.fn(),
}));

// Keep the pure lookup + defs real; only stub the storage writes.
jest.mock("@/assets/data/promo-codes", () => {
  const actual = jest.requireActual("@/assets/data/promo-codes");
  return {
    ...actual,
    loadActivePromos: jest.fn(async () => []),
    activatePromo: jest.fn(async () => {}),
    deactivatePromo: jest.fn(async () => {}),
  };
});

import PromoCodeInput from "../promo-code-input";

describe("PromoCodeInput — clears the field on Apply", () => {
  it("clears a valid code after Apply", async () => {
    render(<PromoCodeInput />);
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.changeText(input, "flowfree"); // the one real promo code
    expect(input.props.value).toBe("flowfree");

    fireEvent.press(screen.getByText("Apply"));

    await waitFor(() => expect(input.props.value).toBe(""));
  });

  it("clears an unrecognized code after Apply (clears on every outcome)", async () => {
    render(<PromoCodeInput />);
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.changeText(input, "not-a-real-code");
    fireEvent.press(screen.getByText("Apply"));

    await waitFor(() => expect(input.props.value).toBe(""));
    // and the user is told why, rather than the field silently emptying
    expect(screen.getByText("Code not recognized.")).toBeOnTheScreen();
  });

  it("keeps the field editable while activation is in flight (so the native clear isn't stranded)", async () => {
    // Hold activation open so we can inspect the in-flight render.
    let resolveActivate: () => void = () => {};
    (activatePromo as jest.Mock).mockImplementationOnce(
      () => new Promise<void>((res) => (resolveActivate = res)),
    );

    render(<PromoCodeInput />);
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.changeText(input, "flowfree");
    fireEvent.press(screen.getByText("Apply"));

    // Mid-activation: state is already cleared AND the field must NOT be
    // disabled — disabling here is exactly what stranded the native clear.
    expect(input.props.value).toBe("");
    expect(input.props.editable).not.toBe(false);

    await act(async () => {
      resolveActivate();
    });

    expect(input.props.value).toBe("");
    expect(input.props.editable).not.toBe(false);
  });
});
