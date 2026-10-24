import { createApiApp } from "../server";

// Initialize and export the Express API app instance for Vercel Serverless Function
const app = createApiApp();

export default app;
