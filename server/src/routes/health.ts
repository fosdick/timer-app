import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Server health check
 *     description: Returns the current server status and timestamp. Useful for uptime monitoring and confirming the API is reachable.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running normally
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-15T10:30:00.000Z"
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
