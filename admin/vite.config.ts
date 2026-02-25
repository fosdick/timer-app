import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      // Proxy all /api requests to the Express server during development.
      // Replaces CRA's "proxy" field in package.json.
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  build: {
    // Keep "build" to match the path the Express server expects
    outDir: "build",
    emptyOutDir: true,
  },
});
