/**
 * pose-library.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical type definitions for the Pose Library — a keyed catalog of yoga
 * poses that flows reference by poseId.
 *
 * The JSON source of truth is pose-library.json (same directory).  Asset files
 * (sketches, SVGs, keypoints) live under svg-pipeline/poses/{poseId}/.
 */

// ── MediaPipe keypoint (same shape as extracted_poses/*_keypoints.json) ──────

export interface MediaPipeKeypoint {
  id: number;
  name: string;
  x: number; // 0–1 left→right
  y: number; // 0–1 top→bottom
  z: number; // depth (relative)
  visibility: number; // 0–1
}

// ── SVG variant view types ───────────────────────────────────────────────────

export const VIEW_TYPES = [
  "front",
  "back",
  "side-left",
  "side-right",
  "three-quarter",
  "annotated-motion", // Arrows showing movement direction
  "annotated-alignment", // Lines showing alignment cues
  "annotated-muscles", // Highlighted muscle groups
] as const;

export type PoseViewType = (typeof VIEW_TYPES)[number] | string;

// ── Claude analysis snapshot ────────────────────────────────────────────────

export interface ClaudeAnalysis {
  confidence: "high" | "medium" | "low";
  notes: string;
  changes: string;
}

// ── Single SVG variant (one view of a pose) ─────────────────────────────────

export interface PoseVariant {
  variantId: string; // kebab-case: "front", "side-left", "annotated-motion"
  label: string; // Display name: "Front View", "Side (Left)"
  viewType: PoseViewType; // Categorization for filtering
  sketch: string; // Path to hand-drawn sketch photo
  tracedSvg: string; // Path to potrace/opencv intermediate
  productionSvg: string; // Path to Claude-refined final SVG
  keypointsJson: string; // MediaPipe 33-landmark file (variant-level)
  overlay: string; // Keypoint skeleton visualization (variant-level)
  claudeAnalysis: ClaudeAnalysis | null;
  status: PoseStatus; // Each variant tracks its own pipeline status
  isPrimary: boolean; // The "default" variant used by the app
  metadata: Record<string, unknown>;
}

// ── Pose-level assets (shared across all variants) ──────────────────────────

export interface PoseAssets {
  variants: Record<string, PoseVariant>; // Keyed by variantId
}

// ── Workflow status ─────────────────────────────────────────────────────────

export type PoseStatus = "draft" | "traced" | "analyzed" | "production-ready";

// ── Canonical pose categories ───────────────────────────────────────────────

export const POSE_CATEGORIES = [
  "standing",
  "seated",
  "supine",
  "prone",
  "inversion",
  "balance",
  "twist",
  "arm-balance",
  "backbend",
  "forward-fold",
  "foundational",
  "resting",
] as const;

export type PoseCategory = (typeof POSE_CATEGORIES)[number] | string;

// ── Core pose entry ─────────────────────────────────────────────────────────

export interface PoseLibraryEntry {
  poseId: string; // kebab-case canonical ID
  englishName: string;
  sanskritName: string;
  difficulty: number; // 1–5
  categories: PoseCategory[];
  description: string;
  cues: string[]; // Coaching instructions
  contraindications: string[];
  assets: PoseAssets;
  status: PoseStatus;
  timestamps: {
    created: string; // ISO 8601
    updated: string;
  };
  metadata: Record<string, unknown>; // Extensible — video source, frame #, etc.
}

// ── Top-level library container ─────────────────────────────────────────────

export interface PoseLibrary {
  version: string;
  lastUpdated: string;
  poses: Record<string, PoseLibraryEntry>; // keyed by poseId
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Look up a single pose by ID. Returns undefined if not found. */
export const getPose = (
  library: PoseLibrary,
  poseId: string
): PoseLibraryEntry | undefined => {
  return library.poses[poseId];
};

/** Get all poses as a flat array (useful for rendering grids). */
export const getAllPoses = (library: PoseLibrary): PoseLibraryEntry[] => {
  return Object.values(library.poses);
};

/** Filter poses by workflow status. */
export const getPosesByStatus = (
  library: PoseLibrary,
  status: PoseStatus
): PoseLibraryEntry[] => {
  return getAllPoses(library).filter((p) => p.status === status);
};

/** Filter poses by category. */
export const getPosesByCategory = (
  library: PoseLibrary,
  category: string
): PoseLibraryEntry[] => {
  return getAllPoses(library).filter((p) => p.categories.includes(category));
};

/** Count poses grouped by status. */
export const getStatusCounts = (
  library: PoseLibrary
): Record<PoseStatus, number> => {
  const counts: Record<PoseStatus, number> = {
    draft: 0,
    traced: 0,
    analyzed: 0,
    "production-ready": 0,
  };
  for (const pose of getAllPoses(library)) {
    counts[pose.status]++;
  }
  return counts;
};

/** Generate a new poseId from an English name (kebab-case). */
export const toPoseId = (englishName: string): string => {
  return englishName
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes (Child's → childs)
    .replace(/[^a-z0-9]+/g, "-") // Non-alphanumeric → hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
};

/** Create a blank variant for a pose. */
export const createBlankVariant = (
  poseId: string,
  variantId: string,
  label: string,
  viewType: PoseViewType,
  isPrimary: boolean = false
): PoseVariant => ({
  variantId,
  label,
  viewType,
  sketch: `poses/${poseId}/${variantId}/sketch.jpg`,
  tracedSvg: `poses/${poseId}/${variantId}/traced.svg`,
  productionSvg: `poses/${poseId}/${variantId}/production.svg`,
  keypointsJson: `poses/${poseId}/${variantId}/keypoints.json`,
  overlay: `poses/${poseId}/${variantId}/overlay.jpg`,
  claudeAnalysis: null,
  status: "draft",
  isPrimary,
  metadata: {},
});

/** Create a blank pose entry with a default "front" variant. */
export const createBlankPose = (
  poseId: string,
  englishName: string
): PoseLibraryEntry => {
  const now = new Date().toISOString();
  const defaultVariant = createBlankVariant(poseId, "front", "Front View", "front", true);
  return {
    poseId,
    englishName,
    sanskritName: "",
    difficulty: 1,
    categories: [],
    description: "",
    cues: [],
    contraindications: [],
    assets: {
      variants: { front: defaultVariant },
    },
    status: "draft",
    timestamps: { created: now, updated: now },
    metadata: {},
  };
};

/** Get the primary variant for a pose (falls back to first variant). */
export const getPrimaryVariant = (
  pose: PoseLibraryEntry
): PoseVariant | undefined => {
  const variants = Object.values(pose.assets.variants);
  return variants.find((v) => v.isPrimary) || variants[0];
};

/** Get all variants as a flat array. */
export const getVariants = (pose: PoseLibraryEntry): PoseVariant[] => {
  return Object.values(pose.assets.variants);
};

/** Compute the overall status of a pose from its variants. */
export const computePoseStatus = (pose: PoseLibraryEntry): PoseStatus => {
  const variants = getVariants(pose);
  if (variants.length === 0) return "draft";
  const statuses = variants.map((v) => v.status);
  if (statuses.every((s) => s === "production-ready")) return "production-ready";
  if (statuses.some((s) => s === "analyzed" || s === "production-ready")) return "analyzed";
  if (statuses.some((s) => s === "traced")) return "traced";
  return "draft";
};
