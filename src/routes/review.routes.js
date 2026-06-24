import express from "express";
import {
  getProductReviews,
  createOrUpdateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createReviewValidator,
  deleteReviewValidator,
} from "../validators/review.validator.js";

// ─────────────────────────────────────────────
//  mergeParams: true
//  Required because this router is mounted under
//  /products/:productId in index.js.
//  Without mergeParams, req.params.productId
//  would be undefined inside this router.
// ─────────────────────────────────────────────
const router = express.Router({ mergeParams: true });

// GET    /api/v1/products/:productId/reviews
// → public — anyone can read reviews
router.get("/", getProductReviews);

// POST   /api/v1/products/:productId/reviews
// → private — must be logged in to review
router.post(
  "/",
  protect,
  createReviewValidator,
  validate,
  createOrUpdateReview
);

// DELETE /api/v1/products/:productId/reviews/:reviewId
// → private — owner or admin only (checked inside controller)
router.delete(
  "/:reviewId",
  protect,
  deleteReviewValidator,
  validate,
  deleteReview
);

export default router;
