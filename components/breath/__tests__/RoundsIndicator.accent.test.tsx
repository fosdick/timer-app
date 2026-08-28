/**
 * Proof that the accent preference reaches the screen.
 *
 * This is the one test that exercises the whole chain end to end:
 *   persisted preference -> UserPreferencesProvider -> useAccent -> useBreathTheme
 *   -> makeStyles -> the colour actually rendered.
 *
 * RoundsIndicator is the reference implementation for the conversion, so this is
 * also the template for testing each converted component: render under two accents,
 * assert the rendered colour differs and equals the expected ramp value.
 *
 * Why this matters more than it looks: the old `const BlueTheme = false` switch
 * failed not because the values were wrong but because module-level
 * StyleSheet.create resolves ONCE at import, so nothing could change at runtime. A
 * test that only checked the token values would have passed against that broken
 * design. This one wouldn't.
 */
import React from "react";
import renderer, { act, ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";

// Control what the preference loads as.
const mockSaved: { data: Record<string, unknown> | null } = { data: null };
jest.mock("@/assets/utils/persistent-storage", () => ({
  getData: jest.fn(async () => mockSaved.data),
  storeData: jest.fn(),
}));

import { UserPreferencesProvider } from "@/components/user-preferences-context";
import { RoundsIndicator } from "../RoundsIndicator";
import { GREEN, BLUE } from "@/assets/theme/accent";

const renderWithAccent = async (accentId: string | null) => {
  mockSaved.data = accentId ? { accentId } : null;
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <UserPreferencesProvider>
        <RoundsIndicator current={1} total={7} />
      </UserPreferencesProvider>,
    );
  });
  return tree;
};

const renderedColor = (tree: ReactTestRenderer): string => {
  const node = tree.root.find(
    (n) => n.type === (Text as unknown) && typeof n.props.children === "string",
  );
  return StyleSheetFlatten(node.props.style).color as string;
};

/** RN flattens style arrays; the component passes a single object, but be tolerant. */
const StyleSheetFlatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style) ? Object.assign({}, ...style) : (style as Record<string, unknown>);

beforeEach(() => {
  mockSaved.data = null;
});

describe("the accent preference reaches the rendered colour", () => {
  it("renders green when no preference is stored", async () => {
    const tree = await renderWithAccent(null);
    expect(renderedColor(tree)).toBe(GREEN.mid);
  });

  it("renders green when green is stored", async () => {
    const tree = await renderWithAccent("green");
    expect(renderedColor(tree)).toBe(GREEN.mid);
  });

  it("renders BLUE when blue is stored", async () => {
    // The assertion the whole feature rests on.
    const tree = await renderWithAccent("blue");
    expect(renderedColor(tree)).toBe(BLUE.mid);
    expect(renderedColor(tree)).not.toBe(GREEN.mid);
  });

  it("falls back to green for an accent id that no longer exists", async () => {
    // A theme could be renamed or dropped in a later version; a stale preference
    // must not leave the component with an undefined colour.
    const tree = await renderWithAccent("chartreuse-deluxe");
    expect(renderedColor(tree)).toBe(GREEN.mid);
  });

  it("still hides itself when there are no rounds", async () => {
    // Canonical entry #8: "Round N of M" only shows during a session. Guard that the
    // theming refactor didn't disturb the early return.
    mockSaved.data = { accentId: "blue" };
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <UserPreferencesProvider>
          <RoundsIndicator current={0} total={0} />
        </UserPreferencesProvider>,
      );
    });
    expect(tree.toJSON()).toBeNull();
  });
});
