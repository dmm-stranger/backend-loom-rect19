import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import notFound from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";


const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

// Stripe's webhook signature check needs the exact raw request bytes.
// The global express.json()/urlencoded() below would consume that stream
// and re-serialize it before payment.routes.js's own express.raw() ever
// runs, so signature verification always failed with a 400. Skipping body
// parsing for this one path lets the route-level express.raw() see the
// untouched body, exactly like Stripe's docs require.
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") return next();
  express.json({ limit: "10kb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") return next();
  express.urlencoded({ extended: true, limit: "10kb" })(req, res, next);
});
app.use(cookieParser());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TechStore API is running",
    environment: process.env.NODE_ENV,
    imageStorage: "cloudinary",
  });
});

app.use("/api/v1", apiRoutes);
app.use(notFound);
app.use(errorMiddleware);

export default app;