/**
 * routes/trace.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxy layer between the admin panel and the python-api SVG pipeline.
 *
 * Routes
 *   POST /api/trace          — Forward multipart sketch upload to python-api /trace.
 *                              Transparently streams the response (SVG or error JSON)
 *                              back to the caller.
 *   GET  /api/trace/health   — Forward health check to python-api /health and
 *                              merge with Node server status.
 *
 * Environment variables
 *   PYTHON_API_URL   Base URL of the python-api service (default: http://localhost:8001)
 *
 * Design notes
 * ─────────────
 * We use Node's built-in `http`/`https` module to pipe the raw request body
 * straight through to python-api, which keeps multipart/form-data intact without
 * needing an extra proxy library or multer.  The response is likewise streamed
 * back so binary SVG content is never buffered in memory unnecessarily.
 */

import { Router, Request, Response } from "express";
import http from "http";
import https from "https";
import { URL } from "url";

const router = Router();

// ── Config ────────────────────────────────────────────────────────────────────

function getPythonApiUrl(): string {
  return (process.env.PYTHON_API_URL || "http://localhost:8001").replace(/\/$/, "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pipe `srcReq` to `targetUrl` and stream the response into `res`.
 * Works for any method / Content-Type, including multipart form-data.
 */
function proxyRequest(
  srcReq: Request,
  res: Response,
  targetUrl: string,
  method: string = srcReq.method,
): void {
  const parsed = new URL(targetUrl);
  const transport = parsed.protocol === "https:" ? https : http;

  // Forward the original headers verbatim; just override host.
  const headers: Record<string, string | string[] | undefined> = {
    ...srcReq.headers,
    host: parsed.host,
  };

  const options: http.RequestOptions = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method,
    headers,
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    // Forward status + headers from python-api → caller
    const statusCode = proxyRes.statusCode ?? 502;
    const responseHeaders: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      if (v !== undefined) responseHeaders[k] = v;
    }
    res.writeHead(statusCode, responseHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err: NodeJS.ErrnoException) => {
    if (res.headersSent) return;
    const detail = err.code === "ECONNREFUSED"
      ? "Python API is not running. Start it with: uvicorn main:app --port 8001"
      : err.message;
    res.status(502).json({ error: "Python API unreachable", detail });
  });

  // Pipe the incoming body straight through (works for multipart, JSON, etc.)
  srcReq.pipe(proxyReq, { end: true });
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/trace:
 *   post:
 *     summary: Convert a sketch photo to SVG
 *     description: >
 *       Proxies the upload to the python-api /trace endpoint.
 *       Accepts a sketch photo (JPEG/PNG) and an optional MediaPipe keypoints
 *       JSON file.  Returns a clean SVG.  All preprocessing and tracing
 *       parameters are forwarded as-is.
 *     tags: [Trace]
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
 *                 description: Sketch photo (JPEG or PNG)
 *               keypoints_file:
 *                 type: string
 *                 format: binary
 *                 description: Optional MediaPipe keypoints JSON (*_keypoints.json)
 *               threshold:
 *                 type: integer
 *                 default: 8
 *               blur_radius:
 *                 type: integer
 *                 default: 3
 *               edge_margin:
 *                 type: integer
 *                 default: 40
 *               turdsize:
 *                 type: integer
 *                 default: 10
 *               alphamax:
 *                 type: number
 *                 default: 1.0
 *               norm_padding:
 *                 type: number
 *                 default: 0.15
 *               norm_vis_threshold:
 *                 type: number
 *                 default: 0.5
 *     responses:
 *       200:
 *         description: SVG file
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 *       415:
 *         description: Unsupported media type
 *       502:
 *         description: Python API unreachable
 */
router.post("/trace", (req: Request, res: Response) => {
  proxyRequest(req, res, `${getPythonApiUrl()}/trace`);
});

/**
 * @swagger
 * /api/trace/health:
 *   get:
 *     summary: Python API health check
 *     description: Returns combined Node server + python-api health status.
 *     tags: [Trace]
 *     responses:
 *       200:
 *         description: Both services healthy
 *       502:
 *         description: Python API unreachable
 */
router.get("/trace/health", async (_req: Request, res: Response) => {
  const pythonApiUrl = getPythonApiUrl();
  try {
    // Small inline fetch using http/https to avoid adding node-fetch
    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const parsed = new URL(`${pythonApiUrl}/health`);
      const transport = parsed.protocol === "https:" ? https : http;
      const r = transport.get(parsed.toString(), (resp) => {
        let body = "";
        resp.on("data", (chunk: Buffer) => { body += chunk.toString(); });
        resp.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve({ raw: body }); }
        });
      });
      r.on("error", reject);
      r.setTimeout(3000, () => { r.destroy(); reject(new Error("timeout")); });
    });

    res.json({
      node: { status: "ok" },
      pythonApi: { url: pythonApiUrl, ...data },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      node: { status: "ok" },
      pythonApi: { url: pythonApiUrl, status: "unreachable", detail: message },
    });
  }
});

export default router;
