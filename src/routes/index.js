import express from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import reviewRoutes from "./review.routes.js";

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

// Reviews are nested under products
// → /api/v1/products/:productId/reviews
router.use("/products/:productId/reviews", reviewRoutes);

// ─── Coming in future phases ───────────────
// router.use("/orders", orderRoutes);     Phase 5
// router.use("/payments", paymentRoutes); Phase 5
// router.use("/admin", adminRoutes);      Phase 6

export default router;
