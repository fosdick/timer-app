/**
 * routes/poses.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD routes for the Pose Library — a canonical catalog of yoga poses that
 * flows reference by poseId.
 *
 * Routes
 *   GET    /api/poses                                              — Full pose library
 *   GET    /api/poses/:poseId                                      — Single pose by ID
 *   POST   /api/poses                                              — Create a new pose (draft)
 *   PUT    /api/poses/:poseId                                      — Update pose metadata / status
 *   POST   /api/poses/:poseId/variants/:variantId/upload-sketch    — Upload sketch for a variant
 *   GET    /api/poses/:poseId/assets/:file                         — Serve pose-level asset (keypoints, overlay)
 *   GET    /api/poses/:poseId/variants/:variantId/assets/:file     — Serve variant asset (sketch, SVG)
 *   PUT    /api/poses/:poseId/variants/:variantId/assets/:file     — Save variant asset content
 *   GET    /api/poses/:poseId/references                           — List reference images
 *   POST   /api/poses/:poseId/references                           — Upload reference image
 *   GET    /api/poses/:poseId/references/:filename                 — Serve reference image
 *   DELETE /api/poses/:poseId/references/:filename                 — Delete reference image
 *   DELETE /api/poses/:poseId                                      — Delete pose + all variants + files
 *   DELETE /api/poses/:poseId/variants/:variantId                  — Delete a single variant + its files
 *   POST   /api/poses/:poseId/review-text                          — Claude text review
 *
 * Data lives in two places:
 *   - Metadata: timer-app/assets/data/pose-library.json   (keyed by poseId)
 *   - Assets:   svg-pipeline/poses/{poseId}/              (sketch, SVG, etc.)
 */

import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

const router = Router();

// ── Paths ────────────────────────────────────────────────────────────────────

/** Pose library JSON — source of truth for all pose metadata. */
const LIBRARY_PATH = path.resolve(
  __dirname,
  "../../../assets/data/pose-library.json"
);

/** Root directory for pose asset folders. */
const POSES_ASSET_DIR = path.resolve(
  __dirname,
  "../../../../svg-pipeline/poses"
);

// ── Multer (sketch uploads) ──────────────────────────────────────────────────

// Store uploads in a temp dir; we rename into the correct pose folder afterward.
const upload = multer({
  dest: path.join(POSES_ASSET_DIR, ".uploads-tmp"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── Library I/O helpers ──────────────────────────────────────────────────────

interface PoseLibrary {
  version: string;
  lastUpdated: string;
  poses: Record<string, Record<string, unknown>>;
}

function readLibrary(): PoseLibrary {
  const raw = fs.readFileSync(LIBRARY_PATH, "utf-8");
  return JSON.parse(raw) as PoseLibrary;
}

function writeLibrary(data: PoseLibrary): void {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ── Validation helpers ───────────────────────────────────────────────────────

const POSE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidPoseId(id: string): boolean {
  return POSE_ID_RE.test(id) && id.length >= 2 && id.length <= 80;
}

/** Extract a route param as a plain string (Express 5 params can be string | string[]). */
function param(req: Request, name: string): string {
  const v = req.params[name as keyof typeof req.params];
  return Array.isArray(v) ? v[0] : (v as string);
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/poses:
 *   get:
 *     summary: Get the full pose library
 *     tags: [Poses]
 *     responses:
 *       200:
 *         description: Pose library object (version, lastUpdated, poses map)
 */
router.get("/poses", (_req: Request, res: Response) => {
  try {
    const library = readLibrary();
    res.json(library);
  } catch (e) {
    console.error("Error reading pose library:", e);
    res.status(500).json({ error: "Could not load pose library" });
  }
});

/**
 * @swagger
 * /api/poses/{poseId}:
 *   get:
 *     summary: Get a single pose by ID
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pose entry
 *       404:
 *         description: Pose not found
 */
router.get("/poses/:poseId", (req: Request, res: Response) => {
  try {
    const library = readLibrary();
    const pose = library.poses[param(req, "poseId")];
    if (!pose) {
      res.status(404).json({ error: "Pose not found" });
      return;
    }
    res.json(pose);
  } catch (e) {
    console.error("Error reading pose:", e);
    res.status(500).json({ error: "Could not load pose" });
  }
});

/**
 * @swagger
 * /api/poses:
 *   post:
 *     summary: Create a new pose entry in the library
 *     tags: [Poses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [poseId, englishName]
 *             properties:
 *               poseId:
 *                 type: string
 *                 description: Unique kebab-case identifier
 *               englishName:
 *                 type: string
 *               sanskritName:
 *                 type: string
 *               difficulty:
 *                 type: number
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               cues:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Pose created
 *       400:
 *         description: Invalid input (missing fields, duplicate ID, bad format)
 */
router.post("/poses", (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.poseId || !body.englishName) {
      res.status(400).json({ error: "poseId and englishName are required" });
      return;
    }

    if (!isValidPoseId(body.poseId)) {
      res.status(400).json({
        error:
          "poseId must be kebab-case (lowercase letters, numbers, hyphens only)",
      });
      return;
    }

    const library = readLibrary();

    // Check for duplicate
    if (library.poses[body.poseId]) {
      res.status(400).json({ error: `Pose ID '${body.poseId}' already exists` });
      return;
    }

    const now = new Date().toISOString();
    const poseId = body.poseId as string;

    // Build the new entry with defaults + a default "front" variant
    const defaultVariantId = "front";
    const newPose = {
      poseId,
      englishName: body.englishName,
      sanskritName: body.sanskritName || "",
      difficulty: body.difficulty || 1,
      categories: body.categories || [],
      description: body.description || "",
      cues: body.cues || [],
      contraindications: body.contraindications || [],
      assets: {
        variants: {
          [defaultVariantId]: {
            variantId: defaultVariantId,
            label: "Front View",
            viewType: "front",
            sketch: `poses/${poseId}/${defaultVariantId}/sketch.jpg`,
            tracedSvg: `poses/${poseId}/${defaultVariantId}/traced.svg`,
            productionSvg: `poses/${poseId}/${defaultVariantId}/production.svg`,
            keypointsJson: `poses/${poseId}/${defaultVariantId}/keypoints.json`,
            overlay: `poses/${poseId}/${defaultVariantId}/overlay.jpg`,
            claudeAnalysis: null,
            status: "draft",
            isPrimary: true,
            metadata: {},
          },
        },
      },
      status: "draft",
      timestamps: { created: now, updated: now },
      metadata: body.metadata || {},
    };

    // Create asset directories (pose root + default variant)
    const variantDir = path.join(POSES_ASSET_DIR, poseId, defaultVariantId);
    if (!fs.existsSync(variantDir)) {
      fs.mkdirSync(variantDir, { recursive: true });
    }

    // Save to library
    library.poses[poseId] = newPose;
    writeLibrary(library);

    res.status(201).json(newPose);
  } catch (e) {
    console.error("Error creating pose:", e);
    res.status(500).json({ error: "Could not create pose" });
  }
});

/**
 * @swagger
 * /api/poses/{poseId}:
 *   put:
 *     summary: Update an existing pose entry
 *     description: >
 *       Partial update — only the fields you send are changed.
 *       poseId and timestamps.created are immutable.
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated pose entry
 *       404:
 *         description: Pose not found
 */
router.put("/poses/:poseId", (req: Request, res: Response) => {
  try {
    const library = readLibrary();
    const poseId = param(req, "poseId");
    const existing = library.poses[poseId];

    if (!existing) {
      res.status(404).json({ error: "Pose not found" });
      return;
    }

    const body = req.body;

    // Merge — shallow merge top-level, deep merge nested objects
    const existingAssets = existing.assets as Record<string, unknown>;
    const bodyAssets = body.assets || {};
    const existingVariants = (existingAssets.variants || {}) as Record<string, unknown>;
    const bodyVariants = bodyAssets.variants || {};

    // Deep merge variants: existing + incoming (incoming wins per-variant)
    const mergedVariants = { ...existingVariants };
    for (const [vid, vdata] of Object.entries(bodyVariants as Record<string, unknown>)) {
      if (vdata === null) {
        // Allow explicit deletion of a variant by setting it to null
        delete mergedVariants[vid];
      } else if (mergedVariants[vid]) {
        mergedVariants[vid] = { ...(mergedVariants[vid] as Record<string, unknown>), ...(vdata as Record<string, unknown>) };
      } else {
        mergedVariants[vid] = vdata;
      }
    }

    const updated = {
      ...existing,
      ...body,
      // Immutable fields
      poseId,
      // Deep merge nested objects
      assets: {
        ...existingAssets,
        ...bodyAssets,
        variants: mergedVariants,
      },
      timestamps: {
        created: (existing.timestamps as Record<string, string>).created,
        updated: new Date().toISOString(),
      },
      metadata: { ...(existing.metadata as Record<string, unknown>), ...(body.metadata || {}) },
    };

    library.poses[poseId] = updated;
    writeLibrary(library);

    res.json(updated);
  } catch (e) {
    console.error("Error updating pose:", e);
    res.status(500).json({ error: "Could not update pose" });
  }
});

/**
 * @swagger
 * /api/poses/{poseId}:
 *   delete:
 *     summary: Delete a pose and all its variants, assets, and reference images
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pose deleted
 *       404:
 *         description: Pose not found
 */
router.delete("/poses/:poseId", (req: Request, res: Response) => {
  try {
    const poseId = param(req, "poseId");
    const library = readLibrary();

    if (!library.poses[poseId]) {
      res.status(404).json({ error: "Pose not found" });
      return;
    }

    // Remove from library JSON
    delete library.poses[poseId];
    writeLibrary(library);

    // Remove asset directory: svg-pipeline/poses/{poseId}/
    // This includes all variants, sketches, SVGs, references, etc.
    const poseDir = path.join(POSES_ASSET_DIR, poseId);
    if (fs.existsSync(poseDir)) {
      fs.rmSync(poseDir, { recursive: true, force: true });
    }

    res.json({ success: true, poseId });
  } catch (e) {
    console.error("Error deleting pose:", e);
    res.status(500).json({ error: "Could not delete pose" });
  }
});

/**
 * @swagger
 * /api/poses/{poseId}/variants/{variantId}:
 *   delete:
 *     summary: Delete a single variant and its asset files
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: variantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variant deleted
 *       404:
 *         description: Pose or variant not found
 */
router.delete("/poses/:poseId/variants/:variantId", (req: Request, res: Response) => {
  try {
    const poseId = param(req, "poseId");
    const variantId = param(req, "variantId");
    const library = readLibrary();

    const pose = library.poses[poseId];
    if (!pose) {
      res.status(404).json({ error: "Pose not found" });
      return;
    }

    const assets = pose.assets as Record<string, unknown>;
    const variants = (assets.variants || {}) as Record<string, unknown>;

    if (!variants[variantId]) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    // Remove variant from library JSON
    delete variants[variantId];
    (pose.timestamps as Record<string, string>).updated = new Date().toISOString();
    writeLibrary(library);

    // Remove variant asset directory: svg-pipeline/poses/{poseId}/{variantId}/
    const variantDir = path.join(POSES_ASSET_DIR, poseId, variantId);
    if (fs.existsSync(variantDir)) {
      fs.rmSync(variantDir, { recursive: true, force: true });
    }

    res.json({ success: true, poseId, variantId });
  } catch (e) {
    console.error("Error deleting variant:", e);
    res.status(500).json({ error: "Could not delete variant" });
  }
});

/**
 * @swagger
 * /api/poses/{poseId}/variants/{variantId}/upload-sketch:
 *   post:
 *     summary: Upload a sketch photo for a specific variant of a pose
 *     description: >
 *       Saves the uploaded file as sketch.jpg in the variant's asset directory.
 *       Creates the directory and variant entry if they don't exist.
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: variantId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               label:
 *                 type: string
 *                 description: Display label for the variant (e.g. "Front View")
 *               viewType:
 *                 type: string
 *                 description: View type (front, back, side-left, side-right, annotated-motion, etc.)
 *     responses:
 *       200:
 *         description: Sketch uploaded successfully
 *       400:
 *         description: No file provided or invalid IDs
 */
router.post(
  "/poses/:poseId/variants/:variantId/upload-sketch",
  upload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const poseId = param(req, "poseId");
      const variantId = param(req, "variantId");

      if (!isValidPoseId(poseId) || !isValidPoseId(variantId)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          error: "poseId and variantId must be kebab-case",
        });
        return;
      }

      // Ensure variant directory exists: poses/{poseId}/{variantId}/
      const variantDir = path.join(POSES_ASSET_DIR, poseId, variantId);
      if (!fs.existsSync(variantDir)) {
        fs.mkdirSync(variantDir, { recursive: true });
      }

      // Move uploaded file
      const sketchPath = path.join(variantDir, "sketch.jpg");
      fs.renameSync(req.file.path, sketchPath);

      // Ensure pose + variant exist in library
      const library = readLibrary();
      const now = new Date().toISOString();

      if (!library.poses[poseId]) {
        const englishName =
          (req.body && req.body.englishName) || poseId.replace(/-/g, " ");
        library.poses[poseId] = {
          poseId,
          englishName,
          sanskritName: "",
          difficulty: 1,
          categories: [],
          description: "",
          cues: [],
          contraindications: [],
          assets: {
            variants: {},
          },
          status: "draft",
          timestamps: { created: now, updated: now },
          metadata: {},
        };
      }

      const pose = library.poses[poseId] as Record<string, unknown>;
      const assets = pose.assets as Record<string, unknown>;
      const variants = (assets.variants || {}) as Record<string, Record<string, unknown>>;

      if (!variants[variantId]) {
        const label = (req.body && req.body.label) || variantId.replace(/-/g, " ");
        const viewType = (req.body && req.body.viewType) || variantId;
        const isFirst = Object.keys(variants).length === 0;

        variants[variantId] = {
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
          isPrimary: isFirst,
          metadata: {},
        };
        assets.variants = variants;
      }

      (pose.timestamps as Record<string, string>).updated = now;
      writeLibrary(library);

      res.json({
        success: true,
        poseId,
        variantId,
        sketchPath: `poses/${poseId}/${variantId}/sketch.jpg`,
      });
    } catch (e) {
      console.error("Error uploading sketch:", e);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Could not upload sketch" });
    }
  }
);

/**
 * @swagger
 * /api/poses/{poseId}/assets/{filename}:
 *   get:
 *     summary: Serve a pose-level asset file (keypoints, overlay)
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [keypoints.json, overlay.jpg]
 *     responses:
 *       200:
 *         description: The requested file
 *       404:
 *         description: File not found
 */
router.get("/poses/:poseId/assets/:filename", (req: Request, res: Response) => {
  const poseId = param(req, "poseId");
  const filename = param(req, "filename");

  // Pose-level files only (variant files use the variant route below)
  const ALLOWED_FILES = ["keypoints.json", "overlay.jpg"];

  if (!ALLOWED_FILES.includes(filename)) {
    res.status(400).json({
      error: `Invalid filename. Allowed: ${ALLOWED_FILES.join(", ")}`,
    });
    return;
  }

  serveFile(res, path.join(POSES_ASSET_DIR, poseId, filename));
});

/**
 * @swagger
 * /api/poses/{poseId}/variants/{variantId}/assets/{filename}:
 *   get:
 *     summary: Serve a variant asset file (sketch, traced SVG, production SVG)
 *     tags: [Poses]
 *     parameters:
 *       - name: poseId
 *         in: path
 *         required: true
 *       - name: variantId
 *         in: path
 *         required: true
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sketch.jpg, traced.svg, production.svg]
 *     responses:
 *       200:
 *         description: The requested file
 *       404:
 *         description: File not found
 */
router.get(
  "/poses/:poseId/variants/:variantId/assets/:filename",
  (req: Request, res: Response) => {
    const poseId = param(req, "poseId");
    const variantId = param(req, "variantId");
    const filename = param(req, "filename");

    const ALLOWED_FILES = ["sketch.jpg", "traced.svg", "production.svg", "keypoints.json", "overlay.jpg"];

    if (!ALLOWED_FILES.includes(filename)) {
      res.status(400).json({
        error: `Invalid filename. Allowed: ${ALLOWED_FILES.join(", ")}`,
      });
      return;
    }

    serveFile(res, path.join(POSES_ASSET_DIR, poseId, variantId, filename));
  }
);

/**
 * PUT /api/poses/:poseId/variants/:variantId/assets/:filename
 * Save a variant asset file (traced SVG, production SVG, keypoints JSON, overlay).
 * Accepts raw body content and writes it to the correct asset location.
 */
router.put(
  "/poses/:poseId/variants/:variantId/assets/:filename",
  (req: Request, res: Response) => {
    try {
      const poseId = param(req, "poseId");
      const variantId = param(req, "variantId");
      const filename = param(req, "filename");

      const WRITABLE_FILES = ["traced.svg", "production.svg", "keypoints.json", "overlay.jpg"];

      if (!WRITABLE_FILES.includes(filename)) {
        res.status(400).json({
          error: `Cannot write '${filename}'. Writable: ${WRITABLE_FILES.join(", ")}`,
        });
        return;
      }

      if (!isValidPoseId(poseId) || !isValidPoseId(variantId)) {
        res.status(400).json({ error: "poseId and variantId must be kebab-case" });
        return;
      }

      // Ensure directory exists
      const variantDir = path.join(POSES_ASSET_DIR, poseId, variantId);
      if (!fs.existsSync(variantDir)) {
        fs.mkdirSync(variantDir, { recursive: true });
      }

      // Get raw body — for SVG/JSON this is text, for images it could be base64
      let content: string | Buffer;
      if (typeof req.body === "string") {
        content = req.body;
      } else if (req.body && req.body.content) {
        content = req.body.content;
      } else {
        res.status(400).json({ error: "No content provided. Send { content: '...' } in JSON body." });
        return;
      }

      const filePath = path.join(variantDir, filename);
      fs.writeFileSync(filePath, content, "utf-8");

      // Optionally update variant status in library
      if (req.body.status) {
        const library = readLibrary();
        const pose = library.poses[poseId];
        if (pose) {
          const assets = pose.assets as Record<string, unknown>;
          const variants = (assets.variants || {}) as Record<string, Record<string, unknown>>;
          if (variants[variantId]) {
            variants[variantId].status = req.body.status;
            (pose.timestamps as Record<string, string>).updated = new Date().toISOString();
            writeLibrary(library);
          }
        }
      }

      res.json({ success: true, poseId, variantId, filename });
    } catch (e) {
      console.error("Error saving variant asset:", e);
      res.status(500).json({ error: "Could not save asset file" });
    }
  }
);

// ── Reference Images (pose-level) ────────────────────────────────────────────
// Stored in svg-pipeline/poses/{poseId}/references/

/**
 * GET /api/poses/:poseId/references
 * List reference image filenames.
 */
router.get("/poses/:poseId/references", (req: Request, res: Response) => {
  const poseId = param(req, "poseId");
  const refDir = path.join(POSES_ASSET_DIR, poseId, "references");

  if (!fs.existsSync(refDir)) {
    res.json({ files: [] });
    return;
  }

  const files = fs
    .readdirSync(refDir)
    .filter((f) => /\.(jpg|jpeg|png|webp|gif|tiff?)$/i.test(f))
    .sort();
  res.json({ files });
});

/**
 * GET /api/poses/:poseId/references/:filename
 * Serve a reference image file.
 */
router.get(
  "/poses/:poseId/references/:filename",
  (req: Request, res: Response) => {
    const poseId = param(req, "poseId");
    const filename = param(req, "filename");
    // Prevent path traversal
    if (filename.includes("..") || filename.includes("/")) {
      res.status(400).json({ error: "Invalid filename" });
      return;
    }
    serveFile(
      res,
      path.join(POSES_ASSET_DIR, poseId, "references", filename)
    );
  }
);

/**
 * POST /api/poses/:poseId/references
 * Upload one or more reference images.
 */
const refUpload = multer({
  dest: path.join(POSES_ASSET_DIR, ".uploads-tmp"),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post(
  "/poses/:poseId/references",
  refUpload.single("image"),
  (req: Request, res: Response) => {
    try {
      const poseId = param(req, "poseId");
      if (!isValidPoseId(poseId)) {
        res.status(400).json({ error: "Invalid poseId" });
        return;
      }

      const refDir = path.join(POSES_ASSET_DIR, poseId, "references");
      if (!fs.existsSync(refDir)) {
        fs.mkdirSync(refDir, { recursive: true });
      }

      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Generate filename with timestamp to avoid conflicts
      const ext = path.extname(req.file.originalname || ".jpg").toLowerCase() || ".jpg";
      const baseName = path
        .basename(req.file.originalname || "ref", ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const ts = Date.now();
      const destName = `${baseName}_${ts}${ext}`;
      const destPath = path.join(refDir, destName);

      fs.renameSync(req.file.path, destPath);

      res.json({ success: true, filename: destName });
    } catch (e) {
      console.error("Error uploading reference image:", e);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Could not upload reference image" });
    }
  }
);

/**
 * DELETE /api/poses/:poseId/references/:filename
 * Delete a reference image.
 */
router.delete(
  "/poses/:poseId/references/:filename",
  (req: Request, res: Response) => {
    try {
      const poseId = param(req, "poseId");
      const filename = param(req, "filename");

      if (filename.includes("..") || filename.includes("/")) {
        res.status(400).json({ error: "Invalid filename" });
        return;
      }

      const filePath = path.join(POSES_ASSET_DIR, poseId, "references", filename);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      fs.unlinkSync(filePath);
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting reference image:", e);
      res.status(500).json({ error: "Could not delete reference image" });
    }
  }
);

// ── Claude Text Review ──────────────────────────────────────────────────────
// Reviews text fields for grammar, spelling, and smart adjustments.

router.post(
  "/poses/:poseId/review-text",
  async (req: Request, res: Response) => {
    try {
      // Lazy import Anthropic (shares same client as claude.ts)
      let Anthropic: typeof import("@anthropic-ai/sdk").default;
      try {
        Anthropic = (await import("@anthropic-ai/sdk")).default;
      } catch {
        res.status(503).json({ error: "Anthropic SDK not available" });
        return;
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: "ANTHROPIC_API_KEY not set" });
        return;
      }

      const client = new Anthropic({ apiKey });
      const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

      const { englishName, sanskritName, description, categories, cues, contraindications } =
        req.body;

      // Build text representation for review
      const textForReview = [
        `English Name: ${englishName || ""}`,
        `Sanskrit Name: ${sanskritName || ""}`,
        `Description: ${description || ""}`,
        `Categories: ${categories || ""}`,
        `Cues (coaching instructions):\n${cues || ""}`,
        `Contraindications:\n${contraindications || ""}`,
      ].join("\n\n");

      const REVIEW_TOOL: Record<string, unknown> = {
        name: "report_text_review",
        description:
          "Report grammar/spelling suggestions for yoga pose text fields.",
        input_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description:
                      "Field name: englishName, sanskritName, description, categories, cues, or contraindications",
                  },
                  original: {
                    type: "string",
                    description: "The original text (or relevant portion)",
                  },
                  revised: {
                    type: "string",
                    description:
                      "The corrected/improved full field value",
                  },
                  note: {
                    type: "string",
                    description: "Brief explanation of the change",
                  },
                },
                required: ["field", "revised", "note"],
              },
              description: "List of suggestions. Empty array if no issues found.",
            },
          },
          required: ["suggestions"],
        },
      };

      const message = await client.messages.create({
        model,
        max_tokens: 4096,
        system: `You are an expert yoga teacher and editor. Review the following yoga pose text fields for:
1. Grammar and spelling errors
2. Consistency in cue formatting (clear, imperative instructions)
3. Proper Sanskrit transliteration
4. Appropriate medical/anatomical terminology in contraindications
5. Clear, concise descriptions

For each field that needs improvement, provide the complete corrected field value (not just the changed part).
For cues and contraindications, maintain the newline-separated format.
Only suggest changes where there are actual issues — do not rewrite text that is already correct.
Call report_text_review with your findings.`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [REVIEW_TOOL as any],
        tool_choice: { type: "tool", name: "report_text_review" },
        messages: [{ role: "user", content: textForReview }],
      });

      const toolUse = message.content.find(
        (block: { type: string }) => block.type === "tool_use"
      ) as { input: { suggestions: Array<Record<string, string>> } } | undefined;

      if (!toolUse) {
        res.json({ suggestions: [] });
        return;
      }

      res.json({
        suggestions: toolUse.input.suggestions || [],
        model,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      });
    } catch (e) {
      console.error("Error in text review:", e);
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  }
);

// ── Shared file-serving helper ───────────────────────────────────────────────

function serveFile(res: Response, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
  };
  if (contentTypes[ext]) {
    res.setHeader("Content-Type", contentTypes[ext]);
  }

  res.sendFile(filePath);
}

export default router;
