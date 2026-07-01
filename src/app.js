import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/index.js";
import notFound from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Serve local uploads only when not using Cloudinary
// 🚨 Warn loudly if running on Vercel without Cloudinary configured
if (process.env.VERCEL && process.env.IMAGE_STORAGE !== "cloudinary") {
  console.warn(
    "🚨 Running on Vercel with IMAGE_STORAGE=local. " +
    "File uploads will fail. Set IMAGE_STORAGE=cloudinary " +
    "and CLOUDINARY_* env vars in your Vercel project settings."
  );
}

// Serve local uploads only when not using Cloudinary
if (process.env.IMAGE_STORAGE !== "cloudinary") {
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}

app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TechStore API is running",
    environment: process.env.NODE_ENV,
    imageStorage: process.env.IMAGE_STORAGE || "local",
  });
});

app.use("/api/v1", apiRoutes);
app.use(notFound);
app.use(errorMiddleware);

export default app;
