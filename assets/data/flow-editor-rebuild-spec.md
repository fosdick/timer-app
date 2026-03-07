# Flow Editor Rebuild — Task Brief
**TimerAppYoga · For Claude coWork**
*Created: 2026-03-07 — Handoff from Foundation Flow build session*

---

## Context

The Foundation Flow has been built and added to `yoga-flows.json`. The existing flow editor (`yoga-flow-editor.html`) is a standalone HTML tool that predates the pose library and SVG pipeline. It doesn't connect to `pose-library.json`, doesn't show SVG previews, and doesn't support many of the attributes the Foundation Flow introduced.

**This task: rebuild the flow editor so it serves as the primary UI for creating and editing flows like Foundation Flow, with full pose library integration.**

---

## What Exists Today

### Current Flow Editor (`yoga-flow-editor.html`)
- Standalone HTML/JS file, no build step
- Can import/export flow JSON arrays
- Supports two item types: **Pose** and **Superset**
- Fields per pose: name, duration, description, progressText, assetId (free-text), halfwayChime
- Fields per superset: name, totalDuration (auto-calc), default assetId, halfwayChime, nested poses
- No connection to pose-library.json
- No SVG preview
- Asset ID list is hardcoded and outdated (`generic, mountain-pose, downward-dog, warrior-1`)
- No support for: phases, poseId/variantId linking, props, transitions, student-paced, rep-based, mantra cues

### Pose Library (`pose-library.json`)
- 30+ poses with full metadata
- Each pose has: poseId, englishName, sanskritName, difficulty, categories, description, cues, contraindications
- Each pose has `assets.variants` — a map of variantId → variant with SVG paths, labels, viewType, status
- SVG paths follow: `poses/{poseId}/{variantId}/traced.svg`
- Status per variant: `traced`, `production-ready`, `draft`

### Foundation Flow (`flow-foundation.json`)
- Extended spec version with 27 steps
- Uses `poseId` and `variantId` references
- Has `phases` arrays for multi-phase steps
- Includes: `halfwayChime`, `halfwayChimeNote`, `props`, `studentPaced`, `isTransition`, `mantraCue`, `modification`, `transitionNote`, `_repBased`, `_reps`, `_placeholder`, `_reviewFlag`, `_todo`
- This is the "source of truth" spec — `yoga-flows.json` is the flattened app-compatible version

### App-Compatible Format (`yoga-flows.json`)
- What the app actually reads at runtime
- Simpler structure: name, duration, description, assetId, halfwayChime
- Supersets with nested poses
- No poseId/variantId — just assetId strings
- Foundation Flow is currently flattened into this format (multi-phase steps → individual items or supersets)

### Registered SVG Assets (`yoga-assets.ts`)
Currently 15 assets mapped:
```
generic, mountain-pose, downward-dog, mountain-overhead,
upward-facing-dog, plank, chaturanga, forward-fold,
halfway-lift, standing-prayer, staff, easy-seat,
fire-log, seated-wide-legged-forward-fold, cobblers
```

---

## What the New Flow Editor Should Do

### Core: Pose Library Integration
1. **Load `pose-library.json` at startup** — populate a searchable pose picker
2. **When user selects a pose**, auto-fill: englishName, sanskritName, description, cues, categories
3. **Show available variants** for the selected pose as a visual grid (SVG thumbnails where available)
4. **Let user pick a variantId** — this becomes the display image for that step
5. **Show SVG preview** inline in the editor for each step (load from `poses/{poseId}/{variantId}/traced.svg`)
6. **Fallback gracefully** — if no SVG exists, show a placeholder icon and note the status

### Core: Flow Item Types
The editor should support these item types, matching what Foundation Flow uses:

| Type | Description | Key Fields |
|------|-------------|------------|
| **Pose** | Single held pose | poseId, variantId, name, duration, description, halfwayChime, assetId |
| **Superset** | Cycle through multiple pose images | name, totalDuration (auto-calc), poses[] |
| **Multi-phase** | One pose with timed internal stages | poseId, phases[] (each with variantId, name, duration, description) |
| **Per-side** | Same pose, two sides | poseId, duration per side, halfwayChime=true, side variants |
| **Student-paced** | Open-ended hold, tap to advance | poseId, variantId, suggestedMinimum, studentPaced=true |
| **Transition** | No hold, just a movement cue | poseId, isTransition=true, description |

### Core: Editable Attributes Per Step
These are all the fields a user should be able to set:

**Identity:**
- `poseId` — select from pose library (or type custom)
- `variantId` — select from pose's available variants
- `name` — display name (auto-filled from library, editable)
- `assetId` — for app rendering (auto-mapped from poseId if registered in yoga-assets.ts)

**Timing:**
- `duration` — seconds (for held poses)
- `totalDuration` — auto-calculated for supersets/multi-phase
- `studentPaced` — boolean, open-ended hold
- `suggestedMinimum` — for student-paced steps

**Audio/Visual Cues:**
- `halfwayChime` — boolean
- `halfwayChimeNote` — text describing when the chime fires
- `mantraCue` — text displayed after the step (e.g., "Om Namah Shivaya")

**Metadata:**
- `description` — instruction text
- `transitionNote` — how to enter this pose
- `modification` — alternative for less advanced students
- `props` — array of prop suggestions (block, strap, blanket)
- `isTransition` — boolean, marks step as a transition
- `_placeholder` — boolean, marks step as using a placeholder SVG
- `_todo` — free text for notes/reminders

**Rep-based (future):**
- `_repBased` — boolean
- `_reps` — number of repetitions

### Dual Export
The editor should output **two formats**:

1. **`flow-foundation.json`** — the full extended spec with all metadata (poseId, variantId, phases, TODOs, etc.)
2. **`yoga-flows.json` entry** — the flattened app-compatible version (auto-generated from the spec)

This way the spec remains the source of truth, and the app-ready version is always derived from it.

---

## UI Recommendations

### Layout
- Left sidebar: flow step list (collapsible cards, drag to reorder)
- Center: step detail editor (all fields for the selected step)
- Right panel: pose library browser / SVG preview

### Visual Style
- Match the app's dark theme (`#080B0c` background) or the existing editor's green palette (`#629231`, `#91BD27`)
- Show SVG thumbnails at reasonable size for visual confirmation
- Color-code step types (pose = green, superset = gold, multi-phase = blue, transition = gray)

### Interactions
- Pose picker: type-ahead search by English name, Sanskrit name, or poseId
- Variant selector: thumbnail grid with labels
- Drag-and-drop reordering of steps
- "Duplicate step" button for quickly building sequences
- "Preview flow" — read-only view showing the full sequence with images and timing

---

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Pose library | `assets/data/pose-library.json` | Read-only source for pose data |
| Foundation Flow (spec) | `assets/data/flow-foundation.json` | Extended spec, source of truth |
| App flows | `assets/data/yoga-flows.json` | App-compatible, derived from spec |
| Current editor | `assets/data/yoga-flow-editor.html` | Existing editor (to be replaced) |
| Asset registry | `assets/data/yoga-assets.ts` | Maps assetId → SVG components |
| SVG files | `poses/{poseId}/{variantId}/traced.svg` | Actual SVG artwork |
| Flow types | `assets/data/yoga-flows.ts` | TypeScript interfaces for app |
| Flow readme | `assets/data/README-FLOWS.md` | Documentation |

---

## Known Issues to Carry Forward

### From Pose Library (review flags — do not auto-fix)
- `locus` poseId is likely a typo for `locust` — requires filesystem rename
- `huge-knees-to-chest` has bad name — probable correct: "Knees to Chest"
- `mountain-pose` poseId does not exist in pose-library.json (SVG asset exists in yoga-assets.ts though)
- Several poses missing sanskritName (chaturanga, upward-facing-dog, halfway-lift, standing-prayer, staff, easy-seat)
- Several variant labels are placeholders ("F View", "H View", "E View", "N View")

### From Foundation Flow
- Step 18 (Rock and Roll) uses `lotus-flower` as placeholder — needs real SVG
- Sun Salutation A is duplicated 3× because flow editor doesn't support repeats yet
- Multi-phase steps are flattened in yoga-flows.json — spec version preserves them

---

## Suggested Build Approach

1. **Start fresh** — don't try to patch the existing editor. It's 770 lines of vanilla JS with no pose library awareness.
2. **Single HTML file** is fine — keep it zero-dependency like the current one, or use a lightweight framework if preferred.
3. **Load pose-library.json via fetch** — the editor runs in-browser, so fetch the JSON and build the pose picker from it.
4. **Load SVGs inline** — fetch the traced.svg files and render them as `<img>` tags using the path pattern.
5. **Start with the Foundation Flow as test data** — import it and verify every field renders correctly.
6. **Export both formats** — generate the extended spec and the flattened app version side by side.

---

## Success Criteria

- [ ] Can load pose-library.json and browse all poses with SVG previews
- [ ] Can create all step types (pose, superset, multi-phase, per-side, student-paced, transition)
- [ ] Can edit every attribute listed in the "Editable Attributes" section
- [ ] Can import Foundation Flow spec and see all 27 steps with correct data
- [ ] Can export both extended spec JSON and app-compatible JSON
- [ ] SVG previews display correctly for poses that have them
- [ ] Poses without SVGs show a clear placeholder state
- [ ] Can reorder steps via drag or move buttons
- [ ] Total duration auto-calculates correctly
