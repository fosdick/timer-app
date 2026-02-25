import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swaggerOptions"; // Import the options created above

import flowsRouter from "./routes/flows";
import healthRouter from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8081";
const specs = swaggerJsdoc(swaggerOptions);

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Serve Swagger UI at a specific route (e.g., /api-docs)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// API routes
app.use("/api", healthRouter);
app.use("/api", flowsRouter);

// Serve static web build in production
if (process.env.NODE_ENV === "production") {
  // Admin SPA — served at /admin (must come before the main catch-all)
  const adminBuildPath = path.resolve(__dirname, "../../admin/build");
  app.use("/admin", express.static(adminBuildPath));
  app.get("/admin/*", (_req: Request, res: Response) => {
    res.sendFile(path.join(adminBuildPath, "index.html"));
  });

  // Main web app (Expo web build) — served at /
  const webBuildPath = path.resolve(__dirname, "../../web-build");
  app.use(express.static(webBuildPath));
  // Catch-all: let Expo Router handle client-side routing
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(webBuildPath, "index.html"));
  });
}

// app is exported for use by server.ts (startup) and api.test.ts (testing)
// listen() is intentionally NOT called here so tests don't open a live port
export { app, PORT, CORS_ORIGIN };
export default app;
