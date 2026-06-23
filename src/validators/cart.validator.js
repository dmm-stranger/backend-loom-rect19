import { body, param } from "express-validator";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

// ─────────────────────────────────────────────
//  ADD ITEM TO CART
//  POST /api/v1/cart/items
//  Body: { productId, qty }
// ─────────────────────────────────────────────
export const addItemValidator = [
  body("productId")
    .notEmpty()
    .withMessage("productId is required")
    .custom(isValidObjectId),

  body("qty")
    .optional()
    .isInt({ min: 1 })
    .withMessage("qty must be a positive integer (minimum 1)"),
];

// ─────────────────────────────────────────────
//  UPDATE ITEM QUANTITY
//  PATCH /api/v1/cart/items/:itemId
//  Params: itemId
//  Body:   { qty }
// ─────────────────────────────────────────────
export const updateItemValidator = [
  param("itemId")
    .custom(isValidObjectId)
    .withMessage("Invalid cart item ID in URL"),

  body("qty")
    .notEmpty()
    .withMessage("qty is required")
    .isInt({ min: 1 })
    .withMessage("qty must be a positive integer (minimum 1)"),
];

// ─────────────────────────────────────────────
//  APPLY COUPON
//  POST /api/v1/cart/apply-coupon
//  Body: { code }
// ─────────────────────────────────────────────
export const applyCouponValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters")
    .isAlphanumeric()
    .withMessage("Coupon code must contain only letters and numbers"),
];
