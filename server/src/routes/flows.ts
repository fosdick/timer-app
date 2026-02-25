import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// Path resolves from server/src/routes/ up to the app root, then into assets/data
const FLOWS_PATH = path.resolve(
  __dirname,
  "../../../assets/data/yoga-flows.json"
);

/**
 * @swagger
 * components:
 *   schemas:
 *     YogaPose:
 *       type: object
 *       required:
 *         - name
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *           description: Display name of the pose
 *           example: Mountain Pose
 *         duration:
 *           type: number
 *           description: Duration in seconds
 *           example: 30
 *         description:
 *           type: string
 *           description: Cue or instruction for the pose
 *           example: Stand tall, feet hip-width apart, arms relaxed at sides
 *         assetId:
 *           type: string
 *           description: Identifier for the SVG pose illustration asset
 *           example: mountain-pose
 *         halfwayChime:
 *           type: boolean
 *           description: Play an audio chime at the halfway point of this pose
 *           example: true
 *         progressText:
 *           type: string
 *           description: Optional override text shown during the pose
 *
 *     YogaSuperset:
 *       type: object
 *       required:
 *         - type
 *         - name
 *         - totalDuration
 *         - poses
 *       properties:
 *         type:
 *           type: string
 *           enum: [superset]
 *           description: Discriminator field — always "superset"
 *         name:
 *           type: string
 *           description: Display name for the superset group
 *           example: Sun Salutation A
 *         totalDuration:
 *           type: number
 *           description: Total duration of all poses combined, in seconds
 *           example: 120
 *         poses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/YogaPose'
 *         assetId:
 *           type: string
 *           description: Shared illustration asset for the superset
 *         halfwayChime:
 *           type: boolean
 *           description: Apply halfway chime as default to all poses in the superset
 *
 *     YogaFlow:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - items
 *         - totalDuration
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the flow
 *           example: morning-daily-basic
 *         name:
 *           type: string
 *           description: Human-readable name shown in the app
 *           example: Daily Practice
 *         description:
 *           type: string
 *           description: Short summary of the flow's focus or intent
 *           example: Foundational full body deep stretch
 *         totalDuration:
 *           type: number
 *           description: Total flow duration in seconds (excludes transition delays)
 *           example: 2365
 *         items:
 *           type: array
 *           description: Ordered sequence of poses and supersets that make up the flow
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/YogaPose'
 *               - $ref: '#/components/schemas/YogaSuperset'
 */

/**
 * @swagger
 * /api/flows:
 *   get:
 *     summary: Get all yoga flows
 *     description: >
 *       Returns the full library of yoga flow sequences. Each flow contains an ordered
 *       list of poses and/or supersets (grouped pose sequences), with durations and
 *       optional cues for each. This is the primary data source for the yoga timer screen.
 *     tags: [Flows]
 *     responses:
 *       200:
 *         description: Array of yoga flows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/YogaFlow'
 *       500:
 *         description: Failed to read flows data from disk
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Could not load flows
 */
router.get("/flows", (_req: Request, res: Response) => {
  try {
    const raw = fs.readFileSync(FLOWS_PATH, "utf-8");
    const flows = JSON.parse(raw);
    res.json(flows);
  } catch (e) {
    console.error("Error reading yoga flows:", e);
    res.status(500).json({ error: "Could not load flows" });
  }
});

export default router;
