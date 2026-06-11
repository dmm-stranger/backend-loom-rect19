import express from "express";
import authRoutes from "./auth.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);

// Future phases will mount additional routers here:
// router.use("/products", productRoutes);
// router.use("/categories", categoryRoutes);
// router.use("/cart", cartRoutes);
// router.use("/wishlist", wishlistRoutes);
// router.use("/orders", orderRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/admin", adminRoutes);

export default router;
