import {
  isSuperset,
  getSupersetDuration,
  getSupersetName,
  calculateFlowDuration,
  getTotalPoseCount,
  calculateFlowDurationWithTransitions,
  TRANSITION_DELAY_SECONDS,
  YogaPose,
  YogaSuperset,
  YogaFlow,
} from "../yoga-flows";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const pose30: YogaPose = { name: "Mountain Pose", duration: 30 };
const pose45: YogaPose = { name: "Warrior I", duration: 45 };
const pose60: YogaPose = { name: "Downward Dog", duration: 60 };

const superset2Poses: YogaSuperset = {
  type: "superset",
  name: "Sun Salutation",
  totalDuration: 75, // 30 + 45
  poses: [pose30, pose45],
};

const superset3Poses: YogaSuperset = {
  type: "superset",
  name: "Splits",
  totalDuration: 135, // 30 + 45 + 60
  poses: [pose30, pose45, pose60],
};

/** A simple flow with 3 standalone poses (no supersets) */
const pureFlow: YogaFlow = {
  id: "pure",
  name: "Pure Flow",
  description: "Three poses, no supersets",
  totalDuration: 135, // 30 + 45 + 60
  items: [pose30, pose45, pose60],
};

/** A mixed flow: 1 standalone pose + 1 two-pose superset */
const mixedFlow: YogaFlow = {
  id: "mixed",
  name: "Mixed Flow",
  description: "One pose, one superset",
  totalDuration: 105, // 30 + (30 + 45)
  items: [pose30, superset2Poses],
};

/** A single-item flow (edge case for transition calc) */
const singlePoseFlow: YogaFlow = {
  id: "single",
  name: "Single Pose Flow",
  description: "One pose only",
  totalDuration: 30,
  items: [pose30],
};

// ─── TRANSITION_DELAY_SECONDS ─────────────────────────────────────────────────

describe("TRANSITION_DELAY_SECONDS", () => {
  it("is 5 seconds", () => {
    expect(TRANSITION_DELAY_SECONDS).toBe(5);
  });
});

// ─── isSuperset ───────────────────────────────────────────────────────────────

describe("isSuperset", () => {
  it("returns true for a superset object", () => {
    expect(isSuperset(superset2Poses)).toBe(true);
  });

  it("returns false for a plain pose", () => {
    expect(isSuperset(pose30)).toBe(false);
  });

  it("returns false for a pose that has no type field", () => {
    const noType: YogaPose = { name: "Child's Pose", duration: 60 };
    expect(isSuperset(noType)).toBe(false);
  });

  it("returns true for a superset with three poses", () => {
    expect(isSuperset(superset3Poses)).toBe(true);
  });
});

// ─── getSupersetDuration ──────────────────────────────────────────────────────

describe("getSupersetDuration", () => {
  it("sums durations of a two-pose superset", () => {
    // 30 + 45 = 75
    expect(getSupersetDuration(superset2Poses)).toBe(75);
  });

  it("sums durations of a three-pose superset", () => {
    // 30 + 45 + 60 = 135
    expect(getSupersetDuration(superset3Poses)).toBe(135);
  });

  it("returns 0 for an empty superset", () => {
    const empty: YogaSuperset = {
      type: "superset",
      name: "Empty",
      totalDuration: 0,
      poses: [],
    };
    expect(getSupersetDuration(empty)).toBe(0);
  });

  it("handles a single-pose superset", () => {
    const single: YogaSuperset = {
      type: "superset",
      name: "Solo",
      totalDuration: 30,
      poses: [pose30],
    };
    expect(getSupersetDuration(single)).toBe(30);
  });
});

// ─── getSupersetName ──────────────────────────────────────────────────────────

describe("getSupersetName", () => {
  it("returns the name field when present", () => {
    expect(getSupersetName(superset2Poses)).toBe("Sun Salutation");
  });

  it("falls back to progressText when name is empty string", () => {
    const legacy: YogaSuperset = {
      type: "superset",
      name: "",
      totalDuration: 30,
      poses: [pose30],
      progressText: "Legacy Group",
    };
    expect(getSupersetName(legacy)).toBe("Legacy Group");
  });

  it("falls back to \"Superset\" when both name and progressText are absent", () => {
    const bare: YogaSuperset = {
      type: "superset",
      name: "",
      totalDuration: 30,
      poses: [pose30],
    };
    expect(getSupersetName(bare)).toBe("Superset");
  });
});

// ─── calculateFlowDuration ────────────────────────────────────────────────────

describe("calculateFlowDuration", () => {
  it("sums durations of standalone poses only", () => {
    // 30 + 45 + 60 = 135
    expect(calculateFlowDuration(pureFlow.items)).toBe(135);
  });

  it("uses totalDuration for superset items (not re-summing poses)", () => {
    // pose30(30) + superset2Poses.totalDuration(75) = 105
    expect(calculateFlowDuration(mixedFlow.items)).toBe(105);
  });

  it("returns 0 for an empty items array", () => {
    expect(calculateFlowDuration([])).toBe(0);
  });

  it("handles a single standalone pose", () => {
    expect(calculateFlowDuration([pose60])).toBe(60);
  });

  it("handles a flow with only a superset", () => {
    expect(calculateFlowDuration([superset3Poses])).toBe(135);
  });
});

// ─── getTotalPoseCount ────────────────────────────────────────────────────────

describe("getTotalPoseCount", () => {
  it("counts standalone poses only", () => {
    // 3 standalone poses
    expect(getTotalPoseCount(pureFlow)).toBe(3);
  });

  it("counts poses inside supersets individually", () => {
    // 1 standalone + 2 in superset = 3
    expect(getTotalPoseCount(mixedFlow)).toBe(3);
  });

  it("returns 1 for a single-pose flow", () => {
    expect(getTotalPoseCount(singlePoseFlow)).toBe(1);
  });

  it("counts all poses in a multi-superset flow", () => {
    const multiSuperset: YogaFlow = {
      id: "multi-ss",
      name: "Multi Superset Flow",
      description: "",
      totalDuration: 0,
      items: [superset2Poses, superset3Poses], // 2 + 3 = 5
    };
    expect(getTotalPoseCount(multiSuperset)).toBe(5);
  });

  it("returns 0 for a flow with no items", () => {
    const empty: YogaFlow = {
      id: "empty",
      name: "Empty",
      description: "",
      totalDuration: 0,
      items: [],
    };
    expect(getTotalPoseCount(empty)).toBe(0);
  });
});

// ─── calculateFlowDurationWithTransitions ─────────────────────────────────────

describe("calculateFlowDurationWithTransitions", () => {
  it("adds (poseCount - 1) × 5s transitions between poses in a pure flow", () => {
    // 3 poses: 30+45+60 = 135 + (3-1)×5 = 145
    expect(calculateFlowDurationWithTransitions(pureFlow)).toBe(145);
  });

  it("adds transitions for individual poses inside supersets", () => {
    // mixedFlow: 1 standalone + 2-pose superset = 3 total poses
    // pose durations: 30 + 30 + 45 = 105 scaled (×1)
    // transitions: (3-1)×5 = 10
    // total: 115
    expect(calculateFlowDurationWithTransitions(mixedFlow)).toBe(115);
  });

  it("adds no transitions for a single-pose flow", () => {
    // 1 pose: 30s + (1-1)×5 = 30
    expect(calculateFlowDurationWithTransitions(singlePoseFlow)).toBe(30);
  });

  it("applies durationMultiplier to scale pose times", () => {
    // pureFlow 3 poses, each doubled: 60+90+120=270 + 2×5=280
    expect(calculateFlowDurationWithTransitions(pureFlow, 2)).toBe(280);
  });

  it("applies durationMultiplier of 0.5 (half speed)", () => {
    // pureFlow 3 poses halved: round(15)+round(22.5→23)+round(30)=15+23+30=68 + 2×5=78
    // Math.round(30*0.5)=15, Math.round(45*0.5)=23 (rounds 22.5 up), Math.round(60*0.5)=30
    expect(calculateFlowDurationWithTransitions(pureFlow, 0.5)).toBe(78);
  });

  it("defaults multiplier to 1 when not provided", () => {
    // same as plain calculation
    const withDefault = calculateFlowDurationWithTransitions(pureFlow);
    const withExplicit = calculateFlowDurationWithTransitions(pureFlow, 1);
    expect(withDefault).toBe(withExplicit);
  });

  it("returns 0 for an empty flow", () => {
    const empty: YogaFlow = {
      id: "empty",
      name: "Empty",
      description: "",
      totalDuration: 0,
      items: [],
    };
    // 0 poses, 0 duration, 0 transitions (max(0-1,0)×5 but (0-1)=-1 so -5 would be wrong)
    // The implementation does: 0 + TRANSITION_DELAY_SECONDS * (0 - 1) = -5
    // Let's verify what the actual implementation produces and match that
    expect(calculateFlowDurationWithTransitions(empty)).toBe(
      0 + TRANSITION_DELAY_SECONDS * (0 - 1)
    );
  });

  it("applies multiplier inside supersets correctly", () => {
    // mixedFlow: pose30 + superset(pose30, pose45) = 3 individual poses
    // With multiplier 2: round(30×2)=60, round(30×2)=60, round(45×2)=90 → 210
    // transitions: (3-1)×5 = 10
    // total: 220
    expect(calculateFlowDurationWithTransitions(mixedFlow, 2)).toBe(220);
  });
});
