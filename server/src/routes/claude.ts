/**
 * routes/claude.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Claude API integration for yoga pose SVG analysis.
 *
 * Routes
 *   POST /api/claude/analyze
 *     Accepts a traced SVG string.  Returns structured pose identification
 *     + a refined/cleaned SVG.  No image needed — Claude reads path
 *     coordinates, bounding boxes, and proportions directly from the SVG XML.
 *
 * Strategy
 * ────────
 * Uses Anthropic tool use (structured output) so the response is always a
 * clean JSON object — no regex parsing needed.  Claude is asked to:
 *   1. Identify the yoga pose by analysing path geometry (proportions, limb
 *      angles, centroid distribution) — SVG-only, no image required.
 *   2. Return a cleaned copy of the SVG — noise paths removed, consistent
 *      styling, tight viewBox.
 *
 * Environment variables
 *   ANTHROPIC_API_KEY   Your Anthropic API key  (required)
 *   CLAUDE_MODEL        Model override           (default: claude-sonnet-4-5-20250929)
 */

import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// ── Client (lazy — only created when the route is first hit) ──────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to server/.env to enable Claude features."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ── Tool schema ───────────────────────────────────────────────────────────────

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "report_pose_analysis",
  description:
    "Report the identified yoga pose and return a cleaned version of the SVG.",
  input_schema: {
    type: "object" as const,
    properties: {
      pose_name: {
        type: "string",
        description: "Common English name of the yoga pose (e.g. 'Warrior I').",
      },
      pose_sanskrit: {
        type: "string",
        description: "Sanskrit name of the pose (e.g. 'Virabhadrasana I'). Empty string if unknown.",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "How confident you are in the pose identification.",
      },
      notes: {
        type: "string",
        description:
          "1–2 sentence description of the pose or any notable features of this particular sketch.",
      },
      refined_svg: {
        type: "string",
        description:
          "The cleaned SVG. Keep all meaningful paths intact — " +
          "only remove paths that are clearly noise (tiny isolated blobs, stray dots). " +
          "Do not modify any <path d='...'> data. " +
          "Do normalize: fill='black', no stroke, consistent viewBox. " +
          "Return the complete SVG string.",
      },
      changes: {
        type: "string",
        description:
          "Brief plain-English summary of changes made to the SVG (e.g. 'Removed 3 noise paths, set fill to black').",
      },
    },
    required: ["pose_name", "confidence", "notes", "refined_svg", "changes"],
  },
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert yoga teacher and SVG developer.

You will receive a traced SVG of a hand-drawn yoga pose sketch.

To identify the pose, analyse the SVG path geometry directly:
  - Compute the bounding boxes of individual path clusters.
  - Infer limb positions from the spatial distribution of path centroids.
  - Use proportions (head-to-torso ratio, arm/leg angles, stance width) to
    distinguish poses (e.g. wide stance + arms out = Warrior II, single-leg
    balance = Tree Pose, seated forward fold vs. standing forward fold, etc.).
  - Apply any <g transform="..."> matrices when reasoning about positions.

To clean the SVG:
  - DO NOT alter any <path d="..."> geometry data.
  - DO remove entire <path> or <g> elements that are clearly noise
    (tiny isolated specks whose bounding box area is < 1% of the main figure).
  - DO ensure all paths have fill="black" and no stroke attribute.
  - DO set a tight viewBox that crops to the figure with ~10% padding.
  - Return the complete, valid SVG string.

Call report_pose_analysis with your findings.`;

// ── Request / response types ──────────────────────────────────────────────────

interface AnalyzeRequest {
  svg: string;
  model?: string;
}

export interface PoseAnalysis {
  pose: {
    name: string;
    sanskrit: string;
    confidence: "high" | "medium" | "low";
    notes: string;
  };
  refinedSvg: string;
  changes: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/claude/analyze:
 *   post:
 *     summary: Identify yoga pose and refine SVG using Claude
 *     description: >
 *       Sends a traced SVG (and optional sketch photo) to Claude.
 *       Returns the identified pose name + a cleaned SVG.
 *     tags: [Claude]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [svg]
 *             properties:
 *               svg:
 *                 type: string
 *                 description: Traced SVG string — Claude reads path geometry directly, no image needed
 *               model:
 *                 type: string
 *                 description: Claude model override
 *     responses:
 *       200:
 *         description: Pose analysis and refined SVG
 *       400:
 *         description: Missing or invalid request body
 *       503:
 *         description: ANTHROPIC_API_KEY not configured
 */
router.post("/claude/analyze", async (req: Request, res: Response) => {
  const { svg, model } = req.body as AnalyzeRequest;

  if (!svg || typeof svg !== "string" || svg.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: svg (string)" });
    return;
  }

  let client: Anthropic;
  try {
    client = getClient();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(503).json({ error: msg });
    return;
  }

  const resolvedModel =
    model ||
    process.env.CLAUDE_MODEL ||
    "claude-sonnet-4-5-20250929";

  // ── Build message content (SVG text only) ─────────────────────────────────

  const userContent: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text: `Here is the traced SVG of a hand-drawn yoga pose sketch:\n\n${svg}\n\nAnalyse the path geometry to identify the pose, then return a cleaned SVG.`,
    },
  ];

  // ── Call Claude ────────────────────────────────────────────────────────────

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: resolvedModel,
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "report_pose_analysis" },
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "Claude API error", detail: msg });
    return;
  }

  // ── Extract tool result ────────────────────────────────────────────────────

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    res.status(502).json({
      error: "Claude did not return the expected tool call.",
      rawContent: message.content,
    });
    return;
  }

  const input = toolUse.input as {
    pose_name: string;
    pose_sanskrit?: string;
    confidence: "high" | "medium" | "low";
    notes: string;
    refined_svg: string;
    changes: string;
  };

  const result: PoseAnalysis = {
    pose: {
      name: input.pose_name,
      sanskrit: input.pose_sanskrit ?? "",
      confidence: input.confidence,
      notes: input.notes,
    },
    refinedSvg: input.refined_svg,
    changes: input.changes,
    model: resolvedModel,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };

  res.json(result);
});

export default router;
