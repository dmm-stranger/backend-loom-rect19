import express from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import reviewRoutes from "./review.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";

const router = express.Router();

// ─── Phase 1 ───────────────────────────────
router.use("/auth", authRoutes);

// ─── Phase 2 ───────────────────────────────
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

// ─── Phase 3 ───────────────────────────────
router.use("/cart", cartRoutes);

// ─── Phase 4 ───────────────────────────────
router.use("/wishlist", wishlistRoutes);
router.use("/products/:productId/reviews", reviewRoutes);

// ─── Phase 5 ───────────────────────────────
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

// ─── Phase 6 ───────────────────────────────
router.use("/admin", adminRoutes);

export default router;
