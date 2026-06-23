import express from "express";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";

const router = express.Router();

// ─── Phase 1 ───────────────────────────────
router.use("/auth", authRoutes);

// ─── Phase 2 ───────────────────────────────
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

// ─── Phase 3 ───────────────────────────────
router.use("/cart", cartRoutes);

// ─── Coming in future phases ───────────────
// router.use("/wishlist", wishlistRoutes); Phase 4
// router.use("/reviews", reviewRoutes);   Phase 4
// router.use("/orders", orderRoutes);     Phase 5
// router.use("/payments", paymentRoutes); Phase 5
// router.use("/admin", adminRoutes);      Phase 6

export default router;
