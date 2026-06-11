import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import apiRoutes from "./routes/index.js";
import notFound from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// ----- Security & parsing middleware -----
app.use(helmet());

// CORS: must allow the Vite frontend origin and credentials (cookies)
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

// ----- Rate limiting (applies to all /api routes) -----
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// ----- Health check -----
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "TechStore API is running" });
});

// ----- API routes (versioned, matches VITE_API_BASE_URL=/api/v1) -----
app.use("/api/v1", apiRoutes);

// ----- 404 + centralized error handler (must be last) -----
app.use(notFound);
app.use(errorMiddleware);

export default app;
