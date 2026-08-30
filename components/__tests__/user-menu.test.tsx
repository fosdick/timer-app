/**
 * Wiring test for the header account menu: the dropdown opens and its two items
 * link to the right routes. (Per product: a light render test with testIDs, not
 * a full E2E.)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

import { UserMenu } from "../user-menu";

beforeEach(() => mockNavigate.mockClear());

describe("UserMenu", () => {
  it("opens the dropdown and shows both items", () => {
    render(<UserMenu />);
    fireEvent.press(screen.getByTestId("account-menu-button"));
    expect(screen.getByTestId("menu-user-preferences")).toBeOnTheScreen();
    expect(screen.getByTestId("menu-app-settings")).toBeOnTheScreen();
  });

  it("User Preferences links to /user-preferences", () => {
    render(<UserMenu />);
    fireEvent.press(screen.getByTestId("account-menu-button"));
    fireEvent.press(screen.getByTestId("menu-user-preferences"));
    expect(mockNavigate).toHaveBeenCalledWith("/user-preferences");
    // push would stack a duplicate screen every time the menu is used, so back
    // needed one press per visit to reach the tab again.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("App Settings links to /settings", () => {
    render(<UserMenu />);
    fireEvent.press(screen.getByTestId("account-menu-button"));
    fireEvent.press(screen.getByTestId("menu-app-settings"));
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });
});
