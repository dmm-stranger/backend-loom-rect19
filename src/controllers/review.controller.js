import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";

// @desc    Get all reviews for a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const reviews = await Review.find({ product: productId })
    .populate("user", "name avatar") // show reviewer name + avatar
    .sort({ createdAt: -1 });        // newest reviews first

  res.status(200).json(
    new ApiResponse(200, {
      reviews,
      ratingsAverage: product.ratingsAverage,
      ratingsCount: product.ratingsCount,
    }, "Reviews fetched")
  );
});

// @desc    Create or update a review
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
//
// One review per user per product (enforced by compound
// unique index on the Review model).
// If user already reviewed this product → update it.
// If not → create a new one.
// Product ratingsAverage + ratingsCount auto-update
// via the post("save") hook on the Review model.
export const createOrUpdateReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: req.user._id,
  });

  if (existingReview) {
    // UPDATE existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save(); // triggers post("save") hook → recalculates ratings

    await existingReview.populate("user", "name avatar");

    return res.status(200).json(
      new ApiResponse(200, { review: existingReview }, "Review updated successfully")
    );
  }

  // CREATE new review
  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    comment,
  });
  // post("save") hook fires automatically → recalculates product ratings

  await review.populate("user", "name avatar");

  res.status(201).json(
    new ApiResponse(201, { review }, "Review submitted successfully")
  );
});

// @desc    Delete a review
// @route   DELETE /api/v1/products/:productId/reviews/:reviewId
// @access  Private (owner or admin)
//
// post("deleteOne") hook fires automatically
// → recalculates product ratings after deletion
export const deleteReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  // Verify the review belongs to this product
  if (review.product.toString() !== productId) {
    throw new ApiError(400, "Review does not belong to this product");
  }

  // Only the review owner or an admin can delete
  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this review");
  }

  await review.deleteOne(); // triggers post("deleteOne") hook → recalculates ratings

  res.status(200).json(
    new ApiResponse(200, null, "Review deleted successfully")
  );
});
