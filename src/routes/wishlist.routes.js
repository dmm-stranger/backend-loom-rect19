import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// GET    /api/v1/wishlist              → get wishlist with full product details
// POST   /api/v1/wishlist/:productId   → add product to wishlist
// DELETE /api/v1/wishlist/:productId   → remove product from wishlist
router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
