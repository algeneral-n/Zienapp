/**
 * @deprecated — This Express server is replaced by the Cloudflare Worker at worker/.
 * Kept temporarily for local Vite dev server support only.
 * All API routes now live in worker/src/routes/.
 * 
 * To run locally:   npx vite   (no need for this server)
 * Production API:   https://api.plt.zien-ai.app  (Cloudflare Worker)
 */
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health Check (kept for local testing)
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    deprecated: true,
    message: "Use https://api.plt.zien-ai.app/health in production",
    timestamp: new Date().toISOString(),
  });
});

// All other API routes are now handled by the Cloudflare Worker
app.all("/api/*", (_req, res) => {
  res.status(410).json({
    error: "This endpoint has moved to the Cloudflare Worker",
    workerUrl: "https://api.plt.zien-ai.app",
  });
});

// --- VITE MIDDLEWARE (local dev only) ---
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZIEN Dev Server running on http://localhost:${PORT}`);
    console.log(`Production API: https://api.plt.zien-ai.app`);
  });
});
