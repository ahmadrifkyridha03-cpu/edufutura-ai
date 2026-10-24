import { createApiApp } from "../server";

// Initialize the Express API app instance for Vercel Serverless Function
const app = createApiApp();

export default function handler(req: any, res: any) {
  // If Vercel rewrote the URL to /api/index, restore originalUrl so Express route matching succeeds
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    req.url = req.originalUrl;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }

  return app(req, res);
}
