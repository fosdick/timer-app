/**
 * The green accent must reproduce the shipped 1.1.0 palette EXACTLY.
 *
 * Phase 1 of the theme work is a pure refactor: four overlapping token sources
 * (colorTheme, designColors, breathTheme, yogaColors) collapse onto one accent
 * ramp, and the agreed acceptance criterion was "in theory a user won't notice any
 * difference". These are the literal hex values read out of the 1.1.0 source before
 * the refactor, so any drift fails here rather than on someone's phone.
 *
 * This also guards the NEXT step. When the blue accent lands, the temptation is to
 * "tidy" a green value while in the neighbourhood; doing so silently restyles the
 * shipped app for every existing user. Green is the brand (the logo is green) and
 * is frozen by this file.
 */
import { colorTheme, designColors } from "@/assets/styles/timer-app";
import { breathTheme } from "@/components/breath/breath-theme";
import { yogaColors } from "@/assets/theme";
import { GREEN, withAlpha, fixedColors } from "@/assets/theme/accent";

describe("colorTheme — exact 1.1.0 values", () => {
  it.each([
    ["fontColor", "#629231"],
    ["borderColor", "#91BD27"],
    ["thumbTintColor", "#4b6806"],
    ["trackColorFalse", "#0D2013"],
    ["minimumTrackTintColor", "#3C4E16"],
    ["thumbColorDisabled", "#0D2013"],
    ["maximumTrackTintColor", "#4b6806"],
    ["backgroundColor", "#080B0c"],
    ["headerLiteShade", "#dfffea"],
    ["headerInk", "#080B0c"],
    ["tabBarActiveTintColor", "#4b6806"],
    ["tabBarInActiveTintColor", "#687076"],
  ])("%s = %s", (key, expected) => {
    expect(colorTheme[key as keyof typeof colorTheme]).toBe(expected);
  });
});

describe("designColors — exact 1.1.0 values", () => {
  it.each([
    ["activeTimerPrimary", "#CDDC39"],
    ["activeNumberSecondary", "#CDDC39"],
    ["activeTimerDimmed", "#7CB342"],
    ["labelPrimary", "#689F38"],
    ["labelSecondary", "#546E7A"],
    ["controlActive", "#CDDC39"],
    ["controlInactive", "#546E7A"],
    ["backgroundPrimary", "#000000"],
  ])("%s = %s", (key, expected) => {
    expect(designColors[key as keyof typeof designColors]).toBe(expected);
  });

  it("controlInactiveOpacity is the neutral at 30%", () => {
    // Was the literal "rgba(84, 110, 122, 0.3)".
    expect(designColors.controlInactiveOpacity).toBe("rgba(84, 110, 122, 0.3)");
  });
});

describe("breathTheme — exact 1.1.0 values", () => {
  it.each([
    ["bg", "#080B0c"],
    ["surface", "#0D110B"],
    ["border", "#91BD27"],
    ["text", "#CDDC39"],
    ["label", "#689F38"],
    ["muted", "#7CB342"],
    ["accent", "#CDDC39"],
    ["accentSoft", "#7CB342"],
    ["buttonText", "#629231"],
  ])("%s = %s", (key, expected) => {
    expect(breathTheme[key as keyof typeof breathTheme]).toBe(expected);
  });

  it("keeps the two alpha tints byte-identical", () => {
    // These were separate literals; they are now derived from the ramp, which only
    // works if `mid` and `bright` are exactly the colours those rgba()s encoded.
    expect(breathTheme.line).toBe("rgba(124, 179, 66, 0.35)");
    expect(breathTheme.tintFaint).toBe("rgba(205, 220, 57, 0.14)");
  });

  it("keeps the per-phase tints", () => {
    expect(breathTheme.phaseTint.inhale).toBe("#CDDC39");
    expect(breathTheme.phaseTint.holdIn).toBe("#7CB342");
    expect(breathTheme.phaseTint.exhale).toBe("#689F38");
    expect(breathTheme.phaseTint.holdOut).toBe("#7CB342");
  });

  it("keeps spacing and radius (not colour, but same module)", () => {
    expect(breathTheme.space).toEqual({ xs: 6, sm: 10, md: 16, lg: 24, xl: 36 });
    expect(breathTheme.radius).toBe(10);
  });
});

describe("yogaColors — exact 1.1.0 values", () => {
  it.each([
    ["poseCurrentIcon", "#81C784"],
    ["poseCurrentName", "#E8F5E9"],
    ["progressText", "#E8F5E9"],
    ["instructionalText", "#81C784"],
    ["flowName", "#689F38"],
    ["timerLabel", "#689F38"],
    ["currentTimeLabel", "#689F38"],
    ["poseNavIcon", "#81C784"],
    ["timerCountdown", "#CDDC39"],
    ["timerCountdownWarning", "#FF6F00"],
    ["backgroundPrimary", "#000000"],
    ["backgroundHeader", "#E8F5E9"],
  ])("%s = %s", (key, expected) => {
    expect(yogaColors[key as keyof typeof yogaColors]).toBe(expected);
  });

  it("keeps poseNavIconOpacity at 1", () => {
    expect(yogaColors.poseNavIconOpacity).toBe(1);
  });
});

describe("the accent contract itself", () => {
  it("green is the brand and is frozen", () => {
    // Spelled out so a future accent edit cannot quietly restyle shipped users.
    expect(GREEN).toEqual({
      bright: "#CDDC39",
      soft: "#81C784",
      mid: "#7CB342",
      muted: "#689F38",
      border: "#91BD27",
      deep: "#629231",
      control: "#4b6806",
      track: "#3C4E16",
      trackOff: "#0D2013",
      tint: "#dfffea",
      tintInk: "#080B0c",
      tintStrong: "#E8F5E9",
      surface: "#0D110B",
    });
  });

  it("the ground is NOT part of the accent", () => {
    // The whole safety argument for adding accents as data: contrast can't break
    // because the surface everything sits on never moves.
    expect(fixedColors.ground).toBe("#080B0c");
    expect(Object.values(GREEN)).not.toContain(fixedColors.ground.toLowerCase());
  });

  it("withAlpha reproduces rgba() exactly", () => {
    expect(withAlpha("#7CB342", 0.35)).toBe("rgba(124, 179, 66, 0.35)");
    expect(withAlpha("#CDDC39", 0.14)).toBe("rgba(205, 220, 57, 0.14)");
    expect(withAlpha("#546E7A", 0.3)).toBe("rgba(84, 110, 122, 0.3)");
  });
});
