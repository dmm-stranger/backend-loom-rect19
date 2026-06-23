import express from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  addItemValidator,
  updateItemValidator,
  applyCouponValidator,
} from "../validators/cart.validator.js";

const router = express.Router();

// All cart routes require authentication
// Guest cart is handled by Redux on the frontend
router.use(protect);

// ─────────────────────────────────────────────
//  CART
// ─────────────────────────────────────────────

// GET    /api/v1/cart  → get user's full cart with totals
// DELETE /api/v1/cart  → clear entire cart (called after order placed)
router.get("/", getCart);
router.delete("/", clearCart);

// ─────────────────────────────────────────────
//  CART ITEMS
// ─────────────────────────────────────────────

// POST   /api/v1/cart/items          → add item (or increase qty if exists)
// PATCH  /api/v1/cart/items/:itemId  → update item quantity
// DELETE /api/v1/cart/items/:itemId  → remove single item
router.post("/items", addItemValidator, validate, addItem);
router.patch("/items/:itemId", updateItemValidator, validate, updateItem);
router.delete("/items/:itemId", removeItem);

// ─────────────────────────────────────────────
//  COUPON
//  ⚠️  /coupon routes MUST be defined BEFORE
//      /items/:itemId — otherwise Express would
//      try to match "coupon" as an :itemId param
// ─────────────────────────────────────────────

// POST   /api/v1/cart/apply-coupon  → apply coupon code to cart
// DELETE /api/v1/cart/coupon        → remove coupon from cart
router.post("/apply-coupon", applyCouponValidator, validate, applyCoupon);
router.delete("/coupon", removeCoupon);

export default router;
