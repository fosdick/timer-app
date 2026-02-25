import {
  formatTime,
  formatMinutesSeconds,
  getTimeParts,
  getTimePartsMinSec,
} from "../format-time";

// ─── getTimeParts ─────────────────────────────────────────────────────────────

describe("getTimeParts", () => {
  it("converts 0 seconds", () => {
    expect(getTimeParts(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it("converts seconds only (< 60)", () => {
    expect(getTimeParts(45)).toEqual({ hours: 0, minutes: 0, seconds: 45 });
  });

  it("converts exactly 60 seconds to 1 minute", () => {
    expect(getTimeParts(60)).toEqual({ hours: 0, minutes: 1, seconds: 0 });
  });

  it("converts 90 seconds to 1m 30s", () => {
    expect(getTimeParts(90)).toEqual({ hours: 0, minutes: 1, seconds: 30 });
  });

  it("converts exactly 1 hour", () => {
    expect(getTimeParts(3600)).toEqual({ hours: 1, minutes: 0, seconds: 0 });
  });

  it("converts 1h 1m 1s", () => {
    expect(getTimeParts(3661)).toEqual({ hours: 1, minutes: 1, seconds: 1 });
  });

  it("handles a typical yoga pose duration (30s)", () => {
    expect(getTimeParts(30)).toEqual({ hours: 0, minutes: 0, seconds: 30 });
  });

  it("handles a typical yoga flow duration (2365s)", () => {
    // 2365s = 39m 25s
    expect(getTimeParts(2365)).toEqual({ hours: 0, minutes: 39, seconds: 25 });
  });
});

// ─── getTimePartsMinSec ───────────────────────────────────────────────────────

describe("getTimePartsMinSec", () => {
  it("converts 0 seconds", () => {
    expect(getTimePartsMinSec(0)).toEqual({ minutes: 0, seconds: 0 });
  });

  it("converts seconds only (< 60)", () => {
    expect(getTimePartsMinSec(59)).toEqual({ minutes: 0, seconds: 59 });
  });

  it("converts exactly 60 seconds to 1 minute", () => {
    expect(getTimePartsMinSec(60)).toEqual({ minutes: 1, seconds: 0 });
  });

  it("converts 90 seconds to 1m 30s", () => {
    expect(getTimePartsMinSec(90)).toEqual({ minutes: 1, seconds: 30 });
  });

  it("rolls past 60 minutes without capping (no hours field)", () => {
    // No hours concept — minutes keep climbing
    expect(getTimePartsMinSec(3661)).toEqual({ minutes: 61, seconds: 1 });
  });

  it("handles default timer value (30s)", () => {
    expect(getTimePartsMinSec(30)).toEqual({ minutes: 0, seconds: 30 });
  });
});

// ─── formatTime ───────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats h:m:s with zero-padding", () => {
    expect(formatTime({ hours: 1, minutes: 2, seconds: 3 })).toBe("01:02:03");
  });

  it("pads single-digit values", () => {
    expect(formatTime({ hours: 0, minutes: 0, seconds: 5 })).toBe("00:00:05");
  });

  it("omits hours when undefined", () => {
    expect(formatTime({ minutes: 5, seconds: 30 })).toBe("05:30");
  });

  it("omits hours and minutes when both undefined", () => {
    expect(formatTime({ seconds: 45 })).toBe("45");
  });

  it("handles all zeros", () => {
    expect(formatTime({ hours: 0, minutes: 0, seconds: 0 })).toBe("00:00:00");
  });

  it("round-trips correctly with getTimeParts", () => {
    const parts = getTimeParts(3661);
    expect(formatTime(parts)).toBe("01:01:01");
  });
});

// ─── formatMinutesSeconds ─────────────────────────────────────────────────────

describe("formatMinutesSeconds", () => {
  it("formats MM:SS with zero-padding", () => {
    expect(formatMinutesSeconds({ minutes: 5, seconds: 30 })).toBe("05:30");
  });

  it("pads single-digit seconds", () => {
    expect(formatMinutesSeconds({ minutes: 0, seconds: 5 })).toBe("00:05");
  });

  it("handles all zeros", () => {
    expect(formatMinutesSeconds({ minutes: 0, seconds: 0 })).toBe("00:00");
  });

  it("ignores the hours field when present", () => {
    expect(formatMinutesSeconds({ hours: 1, minutes: 2, seconds: 3 })).toBe(
      "02:03"
    );
  });

  it("round-trips correctly with getTimePartsMinSec for 90s", () => {
    const parts = getTimePartsMinSec(90);
    expect(formatMinutesSeconds(parts)).toBe("01:30");
  });

  it("round-trips correctly for default timer value (30s)", () => {
    const parts = getTimePartsMinSec(30);
    expect(formatMinutesSeconds(parts)).toBe("00:30");
  });
});
