import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import apiRoutes from "./routes/index.js";
import notFound from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// ─────────────────────────────────────────────
//  ES MODULE __dirname equivalent
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
//  SECURITY & PARSING MIDDLEWARE
// ─────────────────────────────────────────────
app.use(helmet({
  // Allow images to be loaded from our own server in the browser
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─────────────────────────────────────────────
//  STATIC FILE SERVING — LOCAL IMAGE UPLOADS
//  Serves everything inside /uploads/ folder as:
//  http://localhost:8000/uploads/<filename>
//
//  The frontend accesses product/category images
//  using the `url` field stored in MongoDB
//  e.g. "/uploads/images-1718234400000-123.jpg"
//  → full URL: http://localhost:8000/uploads/images-1718234400000-123.jpg
// ─────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// ─────────────────────────────────────────────
//  RATE LIMITING
// ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "TechStore API is running" });
});

// ─────────────────────────────────────────────
//  API ROUTES  →  /api/v1
// ─────────────────────────────────────────────
app.use("/api/v1", apiRoutes);

// ─────────────────────────────────────────────
//  404 + CENTRALIZED ERROR HANDLER (must be last)
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorMiddleware);

export default app;
