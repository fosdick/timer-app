# Yoga Flows - JSON Workflow Guide

## Overview

Yoga flows are now stored in `yoga-flows.json` for easy editing via web tools or manual editing.

## File Structure

```
assets/data/
├── yoga-flows.json              # Your flow data (edit this!)
├── yoga-flows.ts                # TypeScript interfaces (don't edit data here)
├── yoga-flows.schema.json       # JSON Schema for validation
└── yoga-flows.template.json     # Example template to copy
```

## Workflow

### 1. Create/Edit Flows

**Option A: Use your web tool**
- Build a web form that outputs JSON
- Use `yoga-flows.schema.json` for validation
- Copy the output into `yoga-flows.json`

**Option B: Manual editing**
- Copy structure from `yoga-flows.template.json`
- Edit `yoga-flows.json` directly

### 2. Add to the App

Simply paste your JSON into `yoga-flows.json` - the TypeScript will automatically import it with type checking.

### 3. Link Assets (Manual)

After adding poses, update `yoga-assets.ts`:

```typescript
// 1. Create SVG component in assets/images/svgx/yoga-poses/
// 2. Import it in yoga-assets.ts
import { MyNewPoseSvg } from "@/assets/images/svgx/yoga-poses/my-new-pose";

// 3. Add to registry
export const YOGA_ASSETS: Record<string, YogaAsset> = {
  // ... existing assets
  "my-new-pose": {
    id: "my-new-pose",
    type: "svg",
    asset: MyNewPoseSvg,
  },
};
```

Then reference it in your flow JSON:
```json
{
  "name": "My Pose",
  "duration": 30,
  "assetId": "my-new-pose"
}
```

## Flow Data Format

### Basic Pose

```json
{
  "name": "Mountain Pose",
  "duration": 30,
  "description": "Stand tall with feet together",
  "progressText": "Pose 1 of 10",
  "assetId": "mountain-pose"
}
```

**Fields:**
- `name` (required): Display name
- `duration` (required): Seconds
- `description` (optional): Instruction text
- `progressText` (optional): Progress indicator shown in UI
- `assetId` (optional): Reference to SVG/image/video in yoga-assets.ts

### Superset (Grouped Poses)

Use when multiple poses share a timer or should be grouped together:

```json
{
  "type": "superset",
  "totalDuration": 120,
  "progressText": "Both sides - 60 seconds each",
  "assetId": "warrior-1",
  "poses": [
    {
      "name": "Warrior I - Right",
      "duration": 60,
      "description": "Right foot forward"
    },
    {
      "name": "Warrior I - Left",
      "duration": 60,
      "description": "Left foot forward",
      "assetId": "warrior-1-left"
    }
  ]
}
```

**Superset Fields:**
- `type` (required): Must be `"superset"`
- `totalDuration` (required): Total seconds for all poses
- `poses` (required): Array of pose objects
- `progressText` (optional): Text for entire superset
- `assetId` (optional): Default asset for all poses (can override per pose)

**Asset Fallback Logic:**
1. If pose has `assetId` → use it
2. Else if superset has `assetId` → use it
3. Else → use generic yoga icon

### Complete Flow Example

```json
[
  {
    "id": "morning-flow",
    "name": "Morning Flow",
    "description": "Energizing 10-minute sequence",
    "totalDuration": 600,
    "items": [
      {
        "name": "Mountain Pose",
        "duration": 30,
        "description": "Center yourself",
        "progressText": "Pose 1 of 3",
        "assetId": "mountain-pose"
      },
      {
        "type": "superset",
        "totalDuration": 120,
        "progressText": "Sun Salutation A x2",
        "poses": [
          {
            "name": "Sun Salutation A - Round 1",
            "duration": 60
          },
          {
            "name": "Sun Salutation A - Round 2",
            "duration": 60
          }
        ]
      },
      {
        "name": "Savasana",
        "duration": 450,
        "description": "Final relaxation",
        "progressText": "Pose 3 of 3"
      }
    ]
  }
]
```

## Available Asset IDs

Current assets registered in `yoga-assets.ts`:

- `generic` - Default yoga icon (used when no assetId specified)
- `mountain-pose` - Mountain Pose (Tadasana)
- `downward-dog` - Downward Facing Dog
- `warrior-1` - Warrior I

## Tips

1. **Calculate totalDuration**: Sum all pose durations in the flow
2. **Progress text**: Use "Pose X of Y" for consistency, or custom text
3. **Asset IDs**: Must match exactly what's in `yoga-assets.ts`
4. **IDs**: Use kebab-case (lowercase with hyphens): `my-flow-name`
5. **Validation**: Use the schema file with JSON validators

## Web Tool Recommendations

For building your data entry tool, consider:

- **JSON Editor**: https://jsoneditoronline.org (with schema validation)
- **Form Builder**: Create HTML form → output JSON
- **Schema Validator**: Use `yoga-flows.schema.json` to validate before saving

## Testing Your Flows

1. Add JSON to `yoga-flows.json`
2. Run the app in simulator
3. Select your flow from the menu
4. Test that all poses appear correctly
5. Verify timer durations match
6. Check that asset linking works
