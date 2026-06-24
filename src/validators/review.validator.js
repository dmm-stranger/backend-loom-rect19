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
//  CREATE OR UPDATE REVIEW
//  POST /api/v1/products/:productId/reviews
//  Params: productId
//  Body:   { rating, comment }
// ─────────────────────────────────────────────
export const createReviewValidator = [
  param("productId")
    .custom(isValidObjectId)
    .withMessage("Invalid product ID in URL"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a whole number between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 10 })
    .withMessage("Comment must be at least 10 characters")
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),
];

// ─────────────────────────────────────────────
//  DELETE REVIEW
//  DELETE /api/v1/products/:productId/reviews/:reviewId
//  Params: productId, reviewId
// ─────────────────────────────────────────────
export const deleteReviewValidator = [
  param("productId")
    .custom(isValidObjectId)
    .withMessage("Invalid product ID in URL"),

  param("reviewId")
    .custom(isValidObjectId)
    .withMessage("Invalid review ID in URL"),
];
